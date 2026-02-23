import { QueueNames } from '../queue-names';
import { DefaultJobOptions, RateLimiterConfigs } from '../queue-options';

export const AuditQueueDefinitions = {
  AUDIT_EVENTS: {
    name: QueueNames.AUDIT_EVENTS,
    options: DefaultJobOptions.STANDARD,
    limiter: RateLimiterConfigs.AUDIT,
  },
} as const;
