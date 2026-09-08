import { Injectable } from '@nestjs/common';
import { type DatabaseHealthReport, DatabaseHealthPort } from '@workspace/ports';
import type { DatabaseClient } from '@workspace/ports/database-client';

/**
 * Storage-agnostic health aggregator. Concrete client packages
 * (@workspace/prisma, @workspace/mongo, @workspace/redis) register
 * themselves — via `register(this)` on their PrismaService/MongoHealthService/
 * RedisHealthService — during module initialization; database-core never
 * imports their types directly. The DatabaseHealthReport/DatabaseHealthPort
 * contract and DATABASE_HEALTH_TOKEN live in @workspace/ports, DatabaseClient
 * in @workspace/ports/database-client — this class is only the concrete
 * implementation bound to DATABASE_HEALTH_TOKEN.
 */
@Injectable()
export class DatabaseHealthService implements DatabaseHealthPort {
  private readonly clients = new Map<string, DatabaseClient>();

  register(client: DatabaseClient): void {
    this.clients.set(client.name, client);
  }

  async checkAll(): Promise<DatabaseHealthReport[]> {
    const entries = Array.from(this.clients.values());
    return Promise.all(
      entries.map(async (client) => ({
        name: client.name,
        healthy: await client.ping().catch(() => false),
        checkedAt: new Date(),
      })),
    );
  }

  async isHealthy(): Promise<boolean> {
    const reports = await this.checkAll();
    return reports.every((report) => report.healthy);
  }
}
