import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@workspace/prisma';
import { AUDIT_PERSISTENCE_ADAPTERS, AUDIT_PERSISTENCE_TOKENS } from './providers';

export * from './converter';
export * from './adapters';

/**
 * Implements the workspace_audit ports (AuditCommandPort / AuditQueryPort)
 * against Prisma: AuditLog, SystemEvent, ApiLog, JobLog, LoginAttempt. All
 * five tables are append-only — the initial migration REVOKEs UPDATE/DELETE
 * from the application DB roles, so this package only ever creates and reads.
 *
 * @Global() — mirrors OutboxPersistenceModule's precedent: several generic,
 * cross-cutting infra packages (interceptor, queue, auth/core, events) write
 * audit rows as a side channel via `@Optional() @Inject(AUDIT_COMMAND_PORT)`,
 * and none of them have a natural import path into one specific bounded
 * context's module tree. Global means AUDIT_COMMAND_PORT is visible to them
 * as soon as this module is instantiated once, anywhere in the process
 * (always true wherever AuditWorkerModule/AuditModule already import it).
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [...AUDIT_PERSISTENCE_ADAPTERS],
  exports: [...AUDIT_PERSISTENCE_TOKENS],
})
export class AuditPersistenceModule {}
