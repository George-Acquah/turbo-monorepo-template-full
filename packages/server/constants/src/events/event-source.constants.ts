export const SystemEventSource = {
  API: 'api',
  WORKERS: 'workers',
  SCHEDULER: 'scheduler',
} as const;

export type SystemEventSource = (typeof SystemEventSource)[keyof typeof SystemEventSource];

export const EventSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type EventSeverity = (typeof EventSeverity)[keyof typeof EventSeverity];
