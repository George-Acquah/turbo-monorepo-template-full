import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { AuthCoreModule } from '@workspace/auth-core';
import { PaymentLinkTokenModule } from '@workspace/guards';
import { CacheModule, CacheInterceptor } from '@workspace/cache';
import { ServerConfigModule } from '@workspace/config';
import { AppContextModule } from '@workspace/context';
import { EncryptionModule } from '@workspace/encryption';
import { EventsModule } from '@workspace/events';
import { MongoModule } from '@workspace/mongo';
import { ObservabilityModule } from '@workspace/observability';
import { OutboxPersistenceModule } from '@workspace/outbox-persistence';
import { PrismaModule } from '@workspace/prisma';
import { QueueModule } from '@workspace/queue';
import { RateLimitGuard, RateLimitModule } from '@workspace/rate-limit';
import { RedisModule } from '@workspace/redis';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { HttpExceptionEnvelopeFilter } from '@workspace/filters';
import { ApiLoggingInterceptor, HttpResponseEnvelopeInterceptor } from '@workspace/interceptor';

import { HealthController } from './health/health.controller';
import { OriginAuthMiddleware } from './middleware/origin-auth.middleware';
import { RobotsController } from './robots/robots.controller';
import { AppRoutingModule } from './router.module';

@Module({
  imports: [
    ServerConfigModule.forRoot({
      runtime: 'api',
      envFilePaths: [
        'apps/api/.env.local',
        'apps/api/.env',
        '.env.local',
        '.env',
      ],
    }),

    // Order doesn't matter for DI resolution (all @Global()), but this
    // reflects the dependency direction: AppContextModule provides
    // CONTEXT_TOKEN (needed by ObservabilityModule's LoggerService),
    // ObservabilityModule provides LOGGER_TOKEN, RedisModule provides
    // REDIS_PORT_TOKEN — both of the latter required by CacheModule's
    // CacheService.
    AppContextModule,
    ObservabilityModule,
    RedisModule,
    CacheModule,

    // RATE_LIMIT_TOKEN needs REDIS_PORT_TOKEN (already bound above via RedisModule).
    RateLimitModule,

    // Registers the 'jwt'/'jwt-refresh'/'email-password' Passport strategies
    // that @workspace/guards' guards depend on by name at runtime (used by
    // RealtimeController below and by AuthModule's controller). AuthModule
    // itself is imported + route-composed in AppRoutingModule.
    AuthCoreModule,

    // PaymentLinkTokenService now lives in @workspace/guards (not
    // @workspace/auth-core) so a module needing only the guard doesn't have to
    // depend on core's full weight — but it's a real injectable, so it
    // still needs registering globally somewhere. This is that somewhere.
    PaymentLinkTokenModule,

    // @Global() — binds ENCRYPTION_PORT_TOKEN, which modules/billing's
    // IngestWebhookUseCase injects to store provider webhook payloads
    // encrypted at rest. Needs importing exactly once, here (the module is
    // global but Nest still only registers it when something imports it).
    EncryptionModule,

    // EventsModule's EventsPublisherModule only calls QueueModule.registerQueues(),
    // which registers the DOMAIN_EVENTS queue for @InjectQueue() but does NOT bind
    // QUEUE_BUS_TOKEN — that only happens via QueueModule.forRoot() (real BullMQ
    // connection to Redis). Without this, EventPublisherService fails DI resolution
    // at boot (discovered by actually running the app, not by typechecking).
    QueueModule.forRoot(),

    // Database clients — both connect eagerly on boot (PrismaService.$connect,
    // MongooseModule's forRootAsync), so importing them is a real Postgres/Mongo
    // handshake, not a no-op.
    PrismaModule,
    MongoModule,

    // OutboxPersistenceModule is infra-tier (workspace_outbox is "no business
    // meaning" per its own schema doc), not a bounded-context module — it
    // supplies OUTBOX_EVENT_REPOSITORY_TOKEN, which EventsModule needs
    // alongside PrismaModule's TRANSACTION_PORT_TOKEN to let this app produce
    // domain events. Routing/dispatching those events onto per-consumer queues
    // is a separate, worker-side concern (see events-routing.module.ts) — this
    // app only ever writes outbox rows.
    OutboxPersistenceModule,
    EventsModule,

    // RealtimeModule (SSE, user-scoped via Redis pub/sub) is composed via
    // AppRoutingModule below (realtime.routes.ts), same as every other
    // bounded-context module — not imported standalone here. Nothing
    // publishes to it yet — that happens in DomainEventDispatchService, which
    // needs apps/worker (not built yet) as its host.
    AppRoutingModule,
  ],
  controllers: [HealthController, RobotsController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionEnvelopeFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpResponseEnvelopeInterceptor,
    },
    // Registered AFTER the envelope interceptor: global interceptors compose
    // so the first-registered one is outermost, wrapping every later one
    // (including the route handler). A CacheInterceptor cache-hit short-
    // circuits before the handler runs but still flows back up through
    // HttpResponseEnvelopeInterceptor's pipe — so a cached response is still
    // wrapped in the standard `{success, data, ...}` envelope, not returned
    // raw. Verified by boot + curl, not assumed (see catalog's public GETs,
    // the first real @Cacheable/@CacheEvict usage in the repo).
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    // Registered last: writes one ApiLog audit row per request via
    // AUDIT_COMMAND_PORT (@Optional() — no-ops if AuditPersistenceModule
    // isn't in this process, see AuditPersistenceModule's @Global() doc
    // comment). Ordering relative to the other two doesn't matter for
    // correctness (it never transforms the response, only observes it via
    // tap()), only that it still runs on every request including ones that
    // short-circuit through CacheInterceptor.
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiLoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
// Register middleware here so it's visible and easy to customize. We protect
// routes starting with /api by default — change the path in `forRoutes` to
// target a different route group or controller.
export class AppModuleWithMiddleware implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Applied to every route; OriginAuthMiddleware itself exempts infra probes
    // (health/metrics) and Swagger's own routes via an explicit path check
    // (ORIGIN_AUTH_EXEMPT_GET_PATHS in origin-auth.middleware.ts) rather than
    // `.exclude()` here — see that constant's comment for why: Nest's
    // MiddlewareConsumer.exclude() path matching silently mis-prepends the
    // global prefix for exactly this mix of prefixed (health/metrics) and
    // unprefixed (Swagger) real paths, so every exclude() entry that was here
    // previously was actually a no-op.
    consumer
      .apply(OriginAuthMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
