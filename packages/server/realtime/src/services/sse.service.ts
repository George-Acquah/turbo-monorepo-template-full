import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { interval, merge, map, Observable } from 'rxjs';
import {
  REDIS_SUBSCRIBER_FACTORY_TOKEN,
  type RedisSubscriberClient,
  type RedisSubscriberFactory,
  METRICS_PORT_TOKEN,
  type MetricsPort,
  LOGGER_TOKEN,
  type LoggerPort,
} from '@workspace/ports';
import { CommonErrorCodes } from '@workspace/constants';

/** Channel pattern all user-scoped events are published to. */
const REALTIME_USER_PATTERN = 'realtime:user:*';

/**
 * How often (ms) the server sends a keep-alive comment frame on each SSE
 * connection.  Prevents proxies (Render, AWS ALB, Cloudflare) from closing
 * idle connections before a domain event arrives.  Must be below the lowest
 * idle-timeout in the deployment path (Render = 55 s, ALB default = 60 s).
 */
const PING_INTERVAL_MS = 25_000;

/**
 * Maximum simultaneous SSE streams a single user may hold open.
 *
 * The endpoint carries `@SkipRateLimit()` because a per-request-count policy is
 * the wrong shape for a connection opened once and held indefinitely — a client
 * stuck in a reconnect loop would otherwise lock itself out of reconnecting.
 * That justification is only sound if the connection count itself is capped,
 * which is what this is: each stream pins a socket, an EventEmitter listener,
 * and a 25s RxJS interval timer, so an uncapped client can exhaust a 1GB
 * container on its own.
 */
const MAX_CONNECTIONS_PER_USER = 5;

/** SSE message envelope sent over the wire to browser clients. */
export interface SseMessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

/**
 * SseService — bridges Redis pub/sub messages to per-user SSE Observable
 * streams. Workspace is single-tenant (see identity.prisma/notifications.prisma
 * header comments), so there's no organizationId to scope on — a personal,
 * per-user notification stream is the correct fit here anyway.
 *
 * Lifecycle:
 *  1. `onModuleInit`: create one dedicated ioredis subscriber client per API
 *     pod, pattern-subscribe to `realtime:user:*`.
 *  2. On each `pmessage` extract the userId from the channel and emit on an
 *     internal EventEmitter keyed by userId.
 *  3. `subscribe(userId)` returns an Observable that adds a listener for that
 *     userId and cleans up on unsubscribe.
 *  4. `onModuleDestroy`: gracefully close the subscriber connection.
 */
@Injectable()
export class SseService implements OnModuleInit, OnModuleDestroy {
  private readonly loggerContext = SseService.name;
  private subscriberClient!: RedisSubscriberClient;
  private readonly emitter = new EventEmitter();
  /** Live stream count across all users, exported as the `sse_connections_active` gauge. */
  private totalConnections = 0;

  constructor(
    @Inject(REDIS_SUBSCRIBER_FACTORY_TOKEN)
    private readonly subscriberFactory: RedisSubscriberFactory,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Optional()
    @Inject(METRICS_PORT_TOKEN)
    private readonly metrics?: MetricsPort,
  ) {}

  onModuleInit(): void {
    // Listeners are keyed by userId, and `subscribe()` now caps a single user at
    // MAX_CONNECTIONS_PER_USER, so the per-event listener count is bounded by
    // that — not by total concurrent connections. Keep leak detection ON with a
    // small margin above the cap: previously this was setMaxListeners(0), which
    // disabled the warning entirely and meant a regression in the teardown path
    // would accumulate listeners silently with no diagnostic.
    this.emitter.setMaxListeners(MAX_CONNECTIONS_PER_USER + 5);

    this.subscriberClient = this.subscriberFactory.create();

    this.subscriberClient.on('error', (_err: Error) => {
      // Errors are already logged by the factory provider.
    });

    this.subscriberClient.on('pmessage', (pattern: string, channel: string, rawMessage: string) => {
      void pattern; // captured for completeness, unused
      // Channel format: realtime:user:<userId>
      const userId = channel.split(':').at(2);
      if (!userId) return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawMessage);
      } catch {
        parsed = rawMessage;
      }

      this.emitter.emit(userId, parsed);
    });

    void this.subscriberClient.psubscribe(REALTIME_USER_PATTERN);
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriberClient.quit();
  }

  /**
   * Returns a hot Observable of `MessageEvent`-shaped objects for the given
   * organization.  NestJS's `@Sse()` decorator will serialise each emission
   * as an SSE frame over the HTTP/1.1 connection.
   *
   * The subscription is torn down automatically when the browser closes the
   * EventSource connection (Observable unsubscribe).
   *
   * A periodic ping frame is merged into the stream so proxies (Render,
   * AWS ALB, Cloudflare) do not close the connection during quiet periods.
   * The client's `useRealtimeStream` ignores events with `type: 'ping'`.
   */
  subscribe(userId: string): Observable<SseMessageEvent> {
    const events$ = new Observable<SseMessageEvent>((subscriber) => {
      const active = this.emitter.listenerCount(userId);

      if (active >= MAX_CONNECTIONS_PER_USER) {
        this.metrics?.increment('sse_connections_rejected');
        this.logger.warn(
          `SSE connection rejected — user=${userId} already holds ${active} streams ` +
            `(max ${MAX_CONNECTIONS_PER_USER})`,
          this.loggerContext,
        );
        subscriber.error(
          new HttpException(
            {
              message: 'Too many concurrent realtime connections',
              errorCode: CommonErrorCodes.REALTIME_CONNECTION_LIMIT,
              maxConnections: MAX_CONNECTIONS_PER_USER,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          ),
        );
        return;
      }

      // Counters are deliberately UNLABELLED, and the live count is a real
      // gauge. The previous shape tagged both counters with `{ userId }` to let
      // Grafana derive `opened - closed`, which meant one permanent Prometheus
      // series per user who had ever connected, held for process lifetime and
      // growing monotonically with the user base. A gauge answers the same
      // question without the cardinality.
      this.metrics?.increment('sse_connections_opened');
      this.totalConnections += 1;
      this.metrics?.gauge('sse_connections_active', this.totalConnections);
      this.logger.debug(
        `SSE connection opened — user=${userId} active=${active + 1}`,
        this.loggerContext,
      );

      const listener = (payload: unknown) => {
        subscriber.next({
          data: payload as object,
          id: Date.now().toString(),
        });
      };

      this.emitter.on(userId, listener);

      // Cleanup when the client disconnects or the Observable is unsubscribed.
      return () => {
        this.emitter.off(userId, listener);
        this.metrics?.increment('sse_connections_closed');
        this.totalConnections = Math.max(0, this.totalConnections - 1);
        this.metrics?.gauge('sse_connections_active', this.totalConnections);
        this.logger.debug(
          `SSE connection closed — user=${userId} ` +
            `active=${this.emitter.listenerCount(userId)}`,
          this.loggerContext,
        );
      };
    });

    // Emit a no-op ping frame every PING_INTERVAL_MS to keep the TCP
    // connection alive through proxies with aggressive idle timeouts.
    const ping$: Observable<SseMessageEvent> = interval(PING_INTERVAL_MS).pipe(
      map(() => ({ data: '', type: 'ping' })),
    );

    return merge(events$, ping$);
  }
}
