import type { Provider } from '@nestjs/common';
import type { WorkspaceEventHandlerPort } from '@workspace/ports';
import { RecordAuditLogHandler } from './record-audit-log.handler';

/**
 * Module-local DI token — not a shared port. The generated `createDomainEventConsumer` consumer
 * injects the aggregated array and never changes as handlers are added.
 */
export const AUDIT_EVENT_HANDLERS = Symbol('AUDIT_EVENT_HANDLERS');

export const auditEventHandlerProviders: Provider[] = [
  RecordAuditLogHandler,
  {
    provide: AUDIT_EVENT_HANDLERS,
    useFactory: (recordAuditLog: RecordAuditLogHandler): WorkspaceEventHandlerPort[] => [
      recordAuditLog,
    ],
    inject: [RecordAuditLogHandler],
  },
];
