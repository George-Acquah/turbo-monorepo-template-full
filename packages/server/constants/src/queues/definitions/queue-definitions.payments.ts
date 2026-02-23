import { QueueNames } from '../queue-names';
import { DefaultJobOptions, RateLimiterConfigs } from '../queue-options';

export const PaymentsQueueDefinitions = {
  PAYMENT_EVENTS: {
    name: QueueNames.PAYMENT_EVENTS,
    options: DefaultJobOptions.STANDARD,
  },
  PAYMENT_PROCESSING: {
    name: QueueNames.PAYMENT_PROCESSING,
    options: DefaultJobOptions.CRITICAL,
    limiter: RateLimiterConfigs.PAYMENT,
  },
  REFUND_PROCESSING: {
    name: QueueNames.REFUND_PROCESSING,
    options: DefaultJobOptions.CRITICAL,
    limiter: RateLimiterConfigs.PAYMENT,
  },
  WEBHOOKS: {
    name: QueueNames.WEBHOOKS,
    options: DefaultJobOptions.STANDARD,
    limiter: RateLimiterConfigs.WEBHOOKS,
  },
} as const;
