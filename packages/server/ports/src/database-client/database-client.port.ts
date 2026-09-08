// The "implement this to register as a health-checked resource" contract.
// Split into its own subpath (@workspace/ports/database-client) rather than
// bundled into the general `shared` barrel — only the concrete DB client
// packages (@workspace/prisma, @workspace/mongo, @workspace/redis) should
// ever implement it, and giving it a distinct import path lets ESLint
// enforce that by file path (see buildDatabaseClientIsolationZones in
// packages/configs/eslint/base.ts), the same mechanism already used to lock
// down @workspace/databases-core.
//
// DATABASE_HEALTH_TOKEN/DatabaseHealthPort (the consumer side — inject +
// query health status) stay in ./shared/database-health.port.ts and remain
// importable from the main @workspace/ports entry; any app legitimately
// querying health (e.g. apps/api's HealthController) needs those.
export interface DatabaseClient {
  readonly name: string;
  ping(): Promise<boolean>;
}
