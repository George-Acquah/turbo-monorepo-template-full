import { Module } from '@nestjs/common';
import { AuditWorkerModule } from '@workspace/audit';
import { AuthWorkerModule, AuthApplicationPortModule } from '@workspace/auth';
import { AuthCoreInfrastructureModule } from '@workspace/auth-core';
import { PaymentLinkTokenModule } from '@workspace/guards';
import { ServerConfigModule } from '@workspace/config';
import { AppContextModule } from '@workspace/context';
import { EmailModule } from '@workspace/email';
import { EncryptionModule } from '@workspace/encryption';
import { EventsWorkersModule } from '@workspace/events';
import { MongoModule } from '@workspace/mongo';
import { NotificationsWorkerModule } from '@workspace/notifications';
import { ProfilesWorkerModule, ProfilesApplicationPortModule } from '@workspace/profiles';
import { FilesWorkerModule } from '@workspace/files';
import { ObservabilityModule } from '@workspace/observability';
import { OutboxPersistenceModule } from '@workspace/outbox-persistence';
import { PrismaModule } from '@workspace/prisma';
import { PushModule } from '@workspace/push';
import { QueueModule } from '@workspace/queue';
import { RedisModule } from '@workspace/redis';
import { SmsModule } from '@workspace/sms';
import { WhatsAppModule } from '@workspace/whatsapp';

import { EventsRoutingModule } from './events-routing.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ServerConfigModule.forRoot({
      runtime: 'workers',
      envFilePaths: [
        'apps/worker/.env.local',
        'apps/worker/.env',
        '.env.local',
        '.env',
      ],
    }),

    // Order doesn't matter for DI resolution (all @Global()), but this
    // reflects the dependency direction: AppContextModule provides
    // CONTEXT_TOKEN (needed by ObservabilityModule's LoggerService),
    // ObservabilityModule provides LOGGER_TOKEN, RedisModule provides
    // REDIS_PORT_TOKEN — both needed downstream (DomainEventDispatchService's
    // Redis pub/sub publish, QueueProcessor's logger).
    AppContextModule,
    ObservabilityModule,
    RedisModule,

    // QueueProcessor's base class (every processor extends it) has a
    // required @Inject(HASH_PORT_TOKEN) used for request-hash/idempotency
    // bookkeeping. AuthCoreInfrastructureModule is the slice of
    // @workspace/auth-core that binds it, without pulling in the full
    // AuthCoreModule's Passport/JWT/AuthPersistenceModule weight — none of
    // which this app uses (no controller here authenticates a user).
    AuthCoreInfrastructureModule,

    // PaymentLinkTokenService lives in @workspace/guards (a module needing
    // only the guard shouldn't have to depend on core's weight) — this app
    // previously got it transitively via AuthCoreInfrastructureModule above,
    // so this restores that same reach.
    PaymentLinkTokenModule,

    // @Global() — binds ENCRYPTION_PORT_TOKEN. Kept wired as a ready
    // capability for worker-side handlers that store payloads encrypted at
    // rest; Nest only registers it once something imports it.
    EncryptionModule,

    // EventsWorkersModule's EventsPublisherModule only calls
    // QueueModule.registerQueues(), which registers the DOMAIN_EVENTS queue
    // for @InjectQueue() but does NOT bind QUEUE_BUS_TOKEN — that only
    // happens via QueueModule.forRoot() (real BullMQ connection to Redis).
    // Without this, EventPublisherService fails DI resolution at boot
    // (discovered by actually running the app, not by typechecking).
    QueueModule.forRoot(),

    // Database clients — both connect eagerly on boot (PrismaService.$connect,
    // MongooseModule's forRootAsync), so importing them is a real Postgres/Mongo
    // handshake, not a no-op.
    PrismaModule,
    MongoModule,

    // EmailModule/SmsModule/PushModule/WhatsAppModule are all @Global() and
    // self-contained (Sms/WhatsApp import TemplateModule internally) —
    // needed here because NotificationsWorkerModule's handlers inject each
    // channel's *_DELIVERY_PORT.
    EmailModule,
    SmsModule,
    PushModule,
    WhatsAppModule,

    // OutboxPersistenceModule is infra-tier (workspace_outbox is "no business
    // meaning" per its own schema doc), not a bounded-context module — it
    // supplies OUTBOX_EVENT_REPOSITORY_TOKEN/IDEMPOTENCY_KEY_REPOSITORY_TOKEN/
    // SAGA_STATE_REPOSITORY_TOKEN that @workspace/events' processors need.
    OutboxPersistenceModule,

    // EventsRoutingModule (@Global(), app-local) compiles the subscription
    // registry into ROUTING_TABLE_TOKEN, which EventsWorkersModule's
    // DispatchEngine/EventsProcessingModule consume. This is the actual job
    // of this app: drain the outbox, dispatch domain events onto
    // per-consumer queues, and publish to Redis pub/sub for apps/api's
    // RealtimeModule (SSE) to pick up.
    EventsRoutingModule,
    EventsWorkersModule,

    // Bounded-context worker roots — the REACTING half of each module. Each
    // registers its own `<context>.events` queue + processor + handlers.
    // (Its subscription is aggregated separately, in EventsRoutingModule.)
    AuthWorkerModule,
    NotificationsWorkerModule,
    AuditWorkerModule,
    ProfilesWorkerModule,
    FilesWorkerModule,

    // ProfilesApplicationPortModule (narrow, not the full ProfilesModule) —
    // exposes PROFILES_APPLICATION_TOKEN for cross-context handlers (e.g.
    // notifications resolving a recipient's contact info) without importing
    // modules/profiles internals (buildContextBoundaryZones).
    ProfilesApplicationPortModule,

    // AuthApplicationPortModule (narrow, not the full AuthModule, which has
    // HTTP controllers this app doesn't need) — needed because
    // modules/profiles' create-profile-on-user-registered handler needs
    // AUTH_APPLICATION_TOKEN (the registered user's name) to create their
    // Profile, and modules/profiles may not import anything from
    // modules/auth directly (buildContextBoundaryZones).
    AuthApplicationPortModule,
  ],
  controllers: [HealthController],
})
export class WorkersModule {}
