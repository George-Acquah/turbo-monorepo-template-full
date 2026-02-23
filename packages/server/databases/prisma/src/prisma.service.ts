// packages/database/src/prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit, Optional, Inject } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { PROMETHEUS_PORT_TOKEN, PrometheusPort } from '@repo/ports';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Optional() @Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheus?: PrometheusPort,
  ) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    super({ adapter });

    // Metrics middleware (safe, scalable)
    if (this.prometheus) {
      this.$use(async (params, next) => {
        const start = Date.now();
        try {
          const result = await next(params);
          const duration = (Date.now() - start) / 1000;

          // params.action = findMany/create/update/etc
          // params.model = User/Post/etc (may be undefined for raw ops)
          this.prometheus!.recordDatabaseQuery(params.action, params.model ?? 'raw', duration);

          return result;
        } catch (err) {
          const duration = (Date.now() - start) / 1000;
          this.prometheus!.recordDatabaseQuery(params.action, params.model ?? 'raw', duration);
          throw err;
        }
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
