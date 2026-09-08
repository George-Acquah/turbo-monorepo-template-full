export const MongoCollections = {
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_AUDIT: 'notification_audits',
  NOTIFICATION_DELIVERY: 'notification_deliveries',
} as const;

export type MongoCollection = (typeof MongoCollections)[keyof typeof MongoCollections];
