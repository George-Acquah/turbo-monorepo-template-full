import { QueueNames } from '../queue-names';
import { DefaultJobOptions, RateLimiterConfigs } from '../queue-options';

export const NotificationsQueueDefinitions = {
  NOTIFICATION_EVENTS: {
    name: QueueNames.NOTIFICATION_EVENTS,
    options: DefaultJobOptions.STANDARD,
  },
  NOTIFICATIONS_DISPATCH: {
    name: QueueNames.NOTIFICATIONS_DISPATCH,
    options: DefaultJobOptions.STANDARD,
  },
  EMAIL_SMTP: {
    name: QueueNames.EMAIL_SMTP,
    options: DefaultJobOptions.STANDARD,
    limiter: RateLimiterConfigs.EMAIL_SMTP,
  },
  EMAIL_SES: {
    name: QueueNames.EMAIL_SES,
    options: DefaultJobOptions.STANDARD,
    limiter: RateLimiterConfigs.EMAIL_SES,
  },
  EMAIL_SENDGRID: {
    name: QueueNames.EMAIL_SENDGRID,
    options: DefaultJobOptions.STANDARD,
    limiter: RateLimiterConfigs.EMAIL_SENDGRID,
  },
  SMS: {
    name: QueueNames.SMS,
    options: DefaultJobOptions.STANDARD,
    limiter: RateLimiterConfigs.SMS,
  },
  PUSH_NOTIFICATIONS: {
    name: QueueNames.PUSH_NOTIFICATIONS,
    options: DefaultJobOptions.STANDARD,
    limiter: RateLimiterConfigs.PUSH,
  },
} as const;
