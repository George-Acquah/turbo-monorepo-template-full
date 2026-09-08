// Two composition roots: NotificationsModule (HTTP, apps/api — member self-service
// preferences) and NotificationsWorkerModule (event handlers + dispatch, apps/worker).
// Sending stays worker-side; the HTTP half only reads/writes preferences.
export * from './notifications.module';
export * from './notifications.routes';
export * from './notifications.worker.module';
export * from './notifications.subscriptions';
export * from './notifications.produces';
