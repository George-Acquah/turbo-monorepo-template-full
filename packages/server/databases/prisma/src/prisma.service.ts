import { Injectable, OnModuleDestroy, OnModuleInit, Optional, Inject } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PRISMA_RUNTIME_CONFIG_TOKEN, type PrismaRuntimeConfig } from '@repo/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PROMETHEUS_PORT_TOKEN, PrometheusPort } from '@repo/ports';

function extendWithOptionalMetrics(base: PrismaClient, prometheus?: PrometheusPort) {
  return base.$extends({
    name: 'optional-prometheus-metrics',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = Date.now();
          try {
            const result = await query(args);
            const duration = (Date.now() - start) / 1000;
            prometheus?.recordDatabaseQuery(operation, model ?? 'raw', duration);
            return result;
          } catch (err) {
            const duration = (Date.now() - start) / 1000;
            prometheus?.recordDatabaseQuery(operation, model ?? 'raw', duration);
            throw err;
          }
        },
      },
    },
  });
}

export type PrismaDbClient = ReturnType<typeof extendWithOptionalMetrics>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public readonly db: PrismaDbClient;

  constructor(
    @Inject(PRISMA_RUNTIME_CONFIG_TOKEN)
    prismaConfig: PrismaRuntimeConfig,
    @Optional() @Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheus?: PrometheusPort,
  ) {
    const adapter = new PrismaPg({ connectionString: prismaConfig.databaseUrl });

    const base = new PrismaClient({ adapter });

    // IMPORTANT: always same type (no union)
    this.db = extendWithOptionalMetrics(base, this.prometheus);
  }

  async onModuleInit() {
    await this.db.$connect();
  }

  async onModuleDestroy() {
    await this.db.$disconnect();
  }
}
