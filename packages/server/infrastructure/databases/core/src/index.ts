// @workspace/databases-core — database-agnostic shared infrastructure.
//
// Owns: the TransactionRunner unit-of-work convenience wrapper and the
// concrete DatabaseHealthService aggregator (bound to DATABASE_HEALTH_TOKEN).
// Does NOT own any contracts — DatabaseClient, DatabaseHealthReport,
// DatabaseHealthPort, DATABASE_HEALTH_TOKEN, TransactionPort, and
// ContextPort all live in @workspace/ports. This package is implementation
// detail for the concrete DB client packages (@workspace/prisma,
// @workspace/mongo, @workspace/redis) — everyone else should depend on
// @workspace/ports instead (enforced via ESLint import/no-restricted-paths).
export * from './database-core.module';
export * from './interfaces';
export * from './constants';
export * from './transactions';
export * from './health';
export * from './utils';
