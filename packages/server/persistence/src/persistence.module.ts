import { DynamicModule, Global, Module, type Provider, type Type } from '@nestjs/common';
import {
  MongoAuthStoreModule,
  MongoEventsStoreModule,
  MongoModule,
} from '@repo/mongo';
import {
  AUTH_REPO_TOKEN,
  MONGO_AUTH_REPO_TOKEN,
  MONGO_TRANSACTION_PORT_TOKEN,
  PRISMA_AUTH_REPO_TOKEN,
  PRISMA_TRANSACTION_PORT_TOKEN,
  TRANSACTION_PORT_TOKEN,
} from '@repo/ports';
import {
  PrismaAuthStoreModule,
  PrismaEventsStoreModule,
  PrismaModule,
} from '@repo/prisma';
import { resolveStoreDrivers } from './store-drivers';

export interface PersistenceModuleOptions {
  auth?: boolean;
  events?: boolean;
  transactions?: boolean;
}

@Global()
@Module({})
export class PersistenceModule {
  static forRoot(options: PersistenceModuleOptions = {}): DynamicModule {
    const includeAuth = options.auth ?? false;
    const includeEvents = options.events ?? false;
    const includeTransactions = options.transactions ?? true;
    const drivers = resolveStoreDrivers();

    const imports: Array<Type<unknown> | DynamicModule> = [];
    const providers: Provider[] = [];
    const exports: symbol[] = [];

    const requiresPrisma =
      (includeAuth && drivers.authRepoDriver === 'prisma') ||
      (includeEvents && drivers.eventsStoreDriver === 'prisma') ||
      (includeTransactions && drivers.transactionDriver === 'prisma');
    const requiresMongo =
      (includeAuth && drivers.authRepoDriver === 'mongo') ||
      (includeEvents && drivers.eventsStoreDriver === 'mongo') ||
      (includeTransactions && drivers.transactionDriver === 'mongo');

    if (requiresPrisma) {
      imports.push(PrismaModule);
    }

    if (requiresMongo) {
      imports.push(MongoModule);
    }

    if (includeAuth) {
      const authModule =
        drivers.authRepoDriver === 'mongo'
          ? MongoAuthStoreModule
          : PrismaAuthStoreModule;
      imports.push(authModule);
      providers.push({
        provide: AUTH_REPO_TOKEN,
        useExisting:
          drivers.authRepoDriver === 'mongo'
            ? MONGO_AUTH_REPO_TOKEN
            : PRISMA_AUTH_REPO_TOKEN,
      });
      exports.push(AUTH_REPO_TOKEN);
    }

    if (includeEvents) {
      imports.push(
        drivers.eventsStoreDriver === 'mongo'
          ? MongoEventsStoreModule
          : PrismaEventsStoreModule,
      );
    }

    if (includeTransactions) {
      providers.push({
        provide: TRANSACTION_PORT_TOKEN,
        useExisting:
          drivers.transactionDriver === 'mongo'
            ? MONGO_TRANSACTION_PORT_TOKEN
            : PRISMA_TRANSACTION_PORT_TOKEN,
      });
      exports.push(TRANSACTION_PORT_TOKEN);
    }

    return {
      module: PersistenceModule,
      imports,
      providers,
      exports,
    };
  }
}
