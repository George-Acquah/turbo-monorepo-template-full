import { Inject, Injectable } from '@nestjs/common';
import { DispatchEngine } from '@/dispatch/dispatch.engine';
import { REDIS_PORT_TOKEN, RedisPort, LOGGER_TOKEN, LoggerPort } from '@workspace/ports';
import type { DomainEventEnvelope, QueueJobProcessor } from '@workspace/queue';
import type { IdempotencyConfig } from '@workspace/types';

/**
 * Consumes drained outbox events and dispatches them via `DispatchEngine`,
 * then fans a realtime SSE notification out over Redis pub/sub. Plugged into
 * a BullMQ consumer via `createQueueConsumer(QueueNames.DOMAIN_EVENTS,
 * DomainEventDispatchService)` (see `modules/processing.module.ts`) — this
 * class itself never touches BullMQ.
 */
@Injectable()
export class DomainEventDispatchService
  implements QueueJobProcessor<DomainEventEnvelope<unknown>>
{
  private readonly context = DomainEventDispatchService.name;

  constructor(
    private readonly dispatchEngine: DispatchEngine,
    @Inject(REDIS_PORT_TOKEN) private readonly redis: RedisPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {}

  getIdempotencyConfig(event: DomainEventEnvelope<unknown>): IdempotencyConfig {
    return {
      key: event.eventId,
      scope: `dispatch:${this.context}`,
      ttlSeconds: 86400,
      userId: event.actor?.userId ?? null,
    };
  }

  async process(event: DomainEventEnvelope<unknown>): Promise<void> {
    await this.dispatchEngine.dispatch(event);
    await this.publishRealtime(event);
  }

  private async publishRealtime(event: DomainEventEnvelope<unknown>): Promise<void> {
    const userId = event.actor?.userId;
    if (!userId) {
      // System/worker-initiated events with no specific user have no
      // personal SSE stream to notify — expected, not an error.
      return;
    }

    await this.redis
      .publish(`realtime:user:${userId}`, {
        eventId: event.eventId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        correlationId: event.trace?.correlationId ?? event.metadata?.correlationId ?? null,
        payload: event.payload,
        timestamp: new Date().toISOString(),
      })
      .catch((err: Error) => {
        this.logger.warn(`SSE Redis publish failed: ${err.message}`, this.context);
      });
  }
}
