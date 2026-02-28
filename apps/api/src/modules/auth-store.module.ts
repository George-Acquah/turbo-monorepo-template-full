import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { MongoAuthStoreModule } from '@repo/mongo';
import { PrismaAuthStoreModule } from '@repo/prisma';
import {
  AUTH_REPO_TOKEN,
  AuthRepositoryPort,
  MONGO_AUTH_REPO_TOKEN,
  MONGO_TRANSACTION_PORT_TOKEN,
  PRISMA_AUTH_REPO_TOKEN,
  PRISMA_TRANSACTION_PORT_TOKEN,
  TransactionPort,
  TRANSACTION_PORT_TOKEN,
} from '@repo/ports';
import { storeConfig } from '../config/store.config';

@Global()
@Module({})
export class AuthStoreModule {
  static register(): DynamicModule {
    return {
      module: AuthStoreModule,
      imports: [
        ConfigModule.forFeature(storeConfig),
        PrismaAuthStoreModule,
        MongoAuthStoreModule,
      ],
      providers: [
        {
          provide: AUTH_REPO_TOKEN,
          inject: [
            storeConfig.KEY,
            { token: PRISMA_AUTH_REPO_TOKEN, optional: true },
            { token: MONGO_AUTH_REPO_TOKEN, optional: true },
          ],
          useFactory: (
            cfg: ConfigType<typeof storeConfig>,
            prismaRepo?: AuthRepositoryPort,
            mongoRepo?: AuthRepositoryPort,
          ): AuthRepositoryPort => {
            if (cfg.authRepoDriver === 'mongo') {
              if (!mongoRepo) {
                throw new Error(
                  'AUTH_REPO_DRIVER=mongo but MONGO_AUTH_REPO_TOKEN is not available.',
                );
              }
              return mongoRepo;
            }

            if (!prismaRepo) {
              throw new Error(
                'AUTH_REPO_DRIVER=prisma but PRISMA_AUTH_REPO_TOKEN is not available.',
              );
            }
            return prismaRepo;
          },
        },
        {
          provide: TRANSACTION_PORT_TOKEN,
          inject: [
            storeConfig.KEY,
            { token: PRISMA_TRANSACTION_PORT_TOKEN, optional: true },
            { token: MONGO_TRANSACTION_PORT_TOKEN, optional: true },
          ],
          useFactory: (
            cfg: ConfigType<typeof storeConfig>,
            prismaTx?: TransactionPort,
            mongoTx?: TransactionPort,
          ): TransactionPort => {
            if (cfg.transactionDriver === 'mongo') {
              if (!mongoTx) {
                throw new Error(
                  'TRANSACTION_DRIVER=mongo but MONGO_TRANSACTION_PORT_TOKEN is not available.',
                );
              }
              return mongoTx;
            }

            if (!prismaTx) {
              throw new Error(
                'TRANSACTION_DRIVER=prisma but PRISMA_TRANSACTION_PORT_TOKEN is not available.',
              );
            }
            return prismaTx;
          },
        },
      ],
      exports: [AUTH_REPO_TOKEN, TRANSACTION_PORT_TOKEN],
    };
  }
}
