import type { DatabaseClient } from '../database-client';

export interface DatabaseHealthReport {
  name: string;
  healthy: boolean;
  checkedAt: Date;
}

// The "inject + query health status" contract — open to any consumer (e.g.
// apps/api's HealthController). DatabaseClient (the "implement this"
// contract, restricted to prisma/mongo/redis) lives at
// @workspace/ports/database-client, not here — see that file for why.
export abstract class DatabaseHealthPort {
  abstract register(client: DatabaseClient): void;
  abstract checkAll(): Promise<DatabaseHealthReport[]>;
  abstract isHealthy(): Promise<boolean>;
}

export const DATABASE_HEALTH_TOKEN = Symbol('DATABASE_HEALTH_TOKEN');
