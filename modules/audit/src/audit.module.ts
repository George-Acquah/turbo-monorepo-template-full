import { Module } from '@nestjs/common';
import { AuditPersistenceModule } from '@workspace/audit-persistence';
import { SearchAuditLogsUseCase } from './application/use-cases/search-audit-logs.use-case';
import { GetAuditLogByIdUseCase } from './application/use-cases/get-audit-log-by-id.use-case';
import { GetEntityAuditHistoryUseCase } from './application/use-cases/get-entity-audit-history.use-case';
import { SearchSystemEventsUseCase } from './application/use-cases/search-system-events.use-case';
import { SearchApiLogsUseCase } from './application/use-cases/search-api-logs.use-case';
import { SearchJobLogsUseCase } from './application/use-cases/search-job-logs.use-case';
import { SearchLoginAttemptsUseCase } from './application/use-cases/search-login-attempts.use-case';
import { GetMyActivityUseCase } from './application/use-cases/get-my-activity.use-case';
import { AuditController } from './presentation/controllers/audit.controller';
import { MyActivityController } from './presentation/controllers/my-activity.controller';
import { PermissionsModule } from '@workspace/permissions';

/**
 * Composition root for the audit bounded-context module's producing/HTTP
 * half — a read-only admin surface over the append-only audit tables.
 * `AuditPersistenceModule` is not @Global(), so this module imports it
 * directly to get AUDIT_QUERY_PORT (same pattern as AuthModule/AuthPersistenceModule).
 */
@Module({
  imports: [AuditPersistenceModule, PermissionsModule],
  controllers: [AuditController, MyActivityController],
  providers: [
    SearchAuditLogsUseCase,
    GetAuditLogByIdUseCase,
    GetEntityAuditHistoryUseCase,
    SearchSystemEventsUseCase,
    SearchApiLogsUseCase,
    SearchJobLogsUseCase,
    SearchLoginAttemptsUseCase,
    GetMyActivityUseCase,
  ],
})
export class AuditModule {}
