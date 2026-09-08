import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PRISMA_RUNTIME_CONFIG_TOKEN, type PrismaRuntimeConfig } from '@workspace/ports/config';
import type { DatabaseClient } from '@workspace/ports/database-client';
import { PrismaClient } from '../../generated/prisma/index.js';

/**
 * PrismaService — the only Prisma client instance in the app. Uses the
 * @prisma/adapter-pg driver adapter (schema.prisma's schemaEngineDriverAdapters
 * preview feature expects this, not a bare datasourceUrl).
 *
 * This package owns the client only — no repositories. Persistence packages
 * (@workspace/auth-persistence, etc.) inject PrismaService via
 * PRISMA_CLIENT_TOKEN and implement their own ports' adapters against it.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy, DatabaseClient
{
  readonly name = 'prisma';
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Inject(PRISMA_RUNTIME_CONFIG_TOKEN) config: PrismaRuntimeConfig) {
    // `max` has to be passed to the driver adapter here. Putting
    // `?connection_limit=` on the URL does nothing in this setup — that is a
    // Prisma query-engine option, and @prisma/adapter-pg is a node-postgres
    // Pool that never reads it, silently leaving the pool at pg's default.
    super({
      adapter: new PrismaPg({
        connectionString: config.databaseUrl,
        max: config.poolMax,
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to Postgres via Prisma');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async ping(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (err) {
      this.logger.error(`Prisma health check failed: ${(err as Error).message}`);
      return false;
    }
  }
}
