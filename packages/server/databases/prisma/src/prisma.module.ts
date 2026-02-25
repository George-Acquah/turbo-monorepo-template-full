/* eslint-disable @typescript-eslint/no-explicit-any */
// packages/database/src/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaTransactionAdapter } from './prisma-transaction.adapter';
import { PRISMA_TRANSACTION_PORT_TOKEN } from '@repo/ports';

// Helper to create a proxied Prisma service that tracks all queries
function createProxiedPrismaService(prometheusService?: any): PrismaService {
  const prismaService = new PrismaService(prometheusService);

  // If no prometheus service, return as-is
  if (!prometheusService) {
    return prismaService;
  }

  // Create proxy to intercept model accesses
  return new Proxy(prismaService, {
    get(target: any, propertyKey: string | symbol) {
      const originalModel = target[propertyKey];

      // Skip symbols and special properties
      if (
        typeof propertyKey === 'symbol' ||
        (typeof propertyKey === 'string' &&
          (propertyKey.startsWith('$') ||
            propertyKey.startsWith('_') ||
            ['then', 'catch', 'finally'].includes(propertyKey)))
      ) {
        return originalModel;
      }

      // Only proxy Prisma model delegates (user, product, etc.)
      const isModelDelegate = originalModel && typeof originalModel === 'object';

      if (!isModelDelegate) {
        return originalModel;
      }

      const modelName = String(propertyKey);

      // Proxy the model to intercept query methods
      return new Proxy(originalModel, {
        get(modelTarget: any, operation: string | symbol) {
          const originalMethod = modelTarget[operation];

          // Skip symbols and non-functions
          if (typeof operation === 'symbol' || typeof originalMethod !== 'function') {
            return originalMethod;
          }

          // Wrap the method to track timing
          return async function (...args: any[]) {
            const start = Date.now();

            try {
              const result = await originalMethod.apply(modelTarget, args);
              const duration = (Date.now() - start) / 1000;

              prometheusService.recordDatabaseQuery(operation, modelName, duration);

              return result;
            } catch (error) {
              const duration = (Date.now() - start) / 1000;
              prometheusService.recordDatabaseQuery(operation, modelName, duration);

              throw error;
            }
          };
        },
      });
    },
  });
}

// Dynamic factory to create PrismaService with optional PrometheusService injection
const prismaServiceProvider = {
  provide: PrismaService,
  useFactory: (prometheusService?: any) => {
    return createProxiedPrismaService(prometheusService);
  },
  inject: [
    {
      token: 'PrometheusService',
      optional: true,
    },
  ],
};

@Global()
@Module({
  providers: [
    prismaServiceProvider,
    PrismaTransactionAdapter,
    {
      provide: PRISMA_TRANSACTION_PORT_TOKEN,
      useExisting: PrismaTransactionAdapter,
    },
  ],
  exports: [PrismaService, PRISMA_TRANSACTION_PORT_TOKEN],
})
export class PrismaModule {}
