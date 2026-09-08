// DI tokens and stable names for the Mongo layer.
//
// Records that are document-shaped and high-volume live in MongoDB (not
// Postgres): notification instances, per-channel delivery logs, the in-app
// feed, and search read-models. Configuration (templates, preferences) stays in
// Postgres — see the workspace_notifications Prisma schema.

// Default connection name for the Workspace Mongo connection. A named
// connection keeps this isolated from any other Mongoose connection an app may
// open.
export const MONGO_CONNECTION_NAME = 'workspace';

// Collection names (plural) — the single source used by the @Schema({ collection })
// decorators so adapters and ops tooling agree.
export const MongoCollections = {
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_DELIVERIES: 'notification_deliveries',
  IN_APP_NOTIFICATIONS: 'in_app_notifications',
  SEARCH_DOCUMENTS: 'search_documents',
  SEARCH_QUERIES: 'search_queries',
} as const;

export type MongoCollection = (typeof MongoCollections)[keyof typeof MongoCollections];
