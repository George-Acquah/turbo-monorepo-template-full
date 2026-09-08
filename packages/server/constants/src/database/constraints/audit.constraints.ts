import { enumConstraint, expressionConstraint } from '../builders';
import { Schemas, Tables } from '../postgres.constants';
import { AuditActorType, SystemEventSource, EventSeverity } from '../../events';
import { HttpMethod } from '../../audit';
import { JobExecutionStatus } from '../../queue';

// LoginAttempt has no /// @check comment in audit.prisma (free-text
// identifier/failureReason) — no entry here for it.
export const AuditConstraints = [
  enumConstraint({
    schema: Schemas.AUDIT,
    table: Tables.AUDIT_LOGS,
    column: 'actor_type',
    values: AuditActorType,
  }),
  enumConstraint({
    schema: Schemas.AUDIT,
    table: Tables.SYSTEM_EVENTS,
    column: 'source',
    values: SystemEventSource,
  }),
  enumConstraint({
    schema: Schemas.AUDIT,
    table: Tables.SYSTEM_EVENTS,
    column: 'severity',
    values: EventSeverity,
  }),
  enumConstraint({
    schema: Schemas.AUDIT,
    table: Tables.API_LOGS,
    column: 'method',
    values: HttpMethod,
  }),
  expressionConstraint({
    schema: Schemas.AUDIT,
    table: Tables.API_LOGS,
    expression: '"status_code" >= 100 AND "status_code" < 600',
    name: 'chk_api_logs_status_code_range',
  }),
  enumConstraint({
    schema: Schemas.AUDIT,
    table: Tables.JOB_LOGS,
    column: 'status',
    values: JobExecutionStatus,
  }),
] as const;
