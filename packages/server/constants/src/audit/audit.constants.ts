// workspace_audit — enum values for the SystemEvent / ApiLog tables (single
// source for the /// @check constraints in audit.prisma). AuditLog.actorType
// reuses events/event-type.constants.ts (AuditActorType); SystemEvent reuses
// SystemEventSource + EventSeverity from the same file. JobLog.status reuses
// queue/job-status.constants.ts (JobExecutionStatus).

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
