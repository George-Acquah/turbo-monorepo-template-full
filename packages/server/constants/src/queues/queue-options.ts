/**
 * Default job options grouped by workload type.
 */
export const DefaultJobOptions = {
  CRITICAL: {
    attempts: 5,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },

  STANDARD: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 1000,
    },
    removeOnComplete: 50,
    removeOnFail: 500,
  },

  BACKGROUND: {
    attempts: 2,
    backoff: {
      type: 'fixed' as const,
      delay: 5000,
    },
    removeOnComplete: 20,
    removeOnFail: 100,
  },

  SCHEDULED: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 30000,
    },
    removeOnComplete: 10,
    removeOnFail: 50,
  },
} as const;

/**
 * Rate limiter configurations by channel/workload.
 */
export const RateLimiterConfigs = {
  EMAIL: {
    max: 10,
    duration: 1000,
  },
  EMAIL_SES: {
    max: 8,
    duration: 1000,
  },
  EMAIL_SENDGRID: {
    max: 10,
    duration: 1000,
  },
  EMAIL_SMTP: {
    max: 5,
    duration: 1000,
  },
  SMS: {
    max: 5,
    duration: 1000,
  },
  PUSH: {
    max: 100,
    duration: 1000,
  },
  SEARCH: {
    max: 50,
    duration: 1000,
  },
  PAYMENT: {
    max: 20,
    duration: 1000,
  },
  WEBHOOKS: {
    max: 200,
    duration: 1000,
  },
  OUTBOX: {
    max: 100,
    duration: 1000,
  },
  AUDIT: {
    max: 50,
    duration: 1000,
  },
} as const;
