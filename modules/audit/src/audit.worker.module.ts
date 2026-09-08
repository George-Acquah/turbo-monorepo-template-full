import { Module } from '@nestjs/common';
import { AuditPersistenceModule } from '@workspace/audit-persistence';
import { QueueModule, createDomainEventConsumer } from '@workspace/queue';
import { QueueNames } from '@workspace/constants';
import { auditEventHandlerProviders, AUDIT_EVENT_HANDLERS } from './infrastructure/event-handlers/providers';

/**
 * Worker composition root — the REACTING half of the audit context. Imported
 * by apps/worker, never apps/api. `AuditPersistenceModule` gives the handler
 * `AUDIT_COMMAND_PORT` (Prisma-backed, append-only AuditLog table).
 */
@Module({
  imports: [
    AuditPersistenceModule,
    QueueModule.registerQueues([{ name: QueueNames.AUDIT_EVENTS }]),
  ],
  providers: [
    ...auditEventHandlerProviders,
    createDomainEventConsumer(QueueNames.AUDIT_EVENTS, AUDIT_EVENT_HANDLERS),
  ],
})
export class AuditWorkerModule {}
