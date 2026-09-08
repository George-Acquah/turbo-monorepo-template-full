// @workspace/mongo — MongoDB (Mongoose) infrastructure.
//
// Owns the document-shaped, high-volume RECORDS that do not belong in Postgres:
// notification instances, per-channel delivery logs, the in-app feed, and search
// read-models. Notification CONFIG (templates, preferences) lives in the
// workspace_notifications Prisma schema.
export * from './client';
export * from './schemas';
export * from './providers';
export * from './health';
export * from './modules';
