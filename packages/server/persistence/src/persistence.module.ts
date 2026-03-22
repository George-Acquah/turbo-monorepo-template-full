import { DynamicModule, Global, Module, type Provider, type Type } from '@nestjs/common';
import {
  AUTH_REPO_TOKEN,
  PRISMA_AUTH_REPO_TOKEN,
  PRISMA_TRANSACTION_PORT_TOKEN,
  TRANSACTION_PORT_TOKEN,
} from '@repo/ports';
import {
  PrismaAuthStoreModule,
  PrismaEventsStoreModule,
  PrismaModule,
} from '@repo/prisma';

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

    const imports: Array<Type<unknown> | DynamicModule> = [];
    const providers: Provider[] = [];
    const exports: symbol[] = [];

    if (includeAuth || includeEvents || includeTransactions) {
      imports.push(PrismaModule);
    }

    if (includeAuth) {
      imports.push(PrismaAuthStoreModule);
      providers.push({
        provide: AUTH_REPO_TOKEN,
        useExisting: PRISMA_AUTH_REPO_TOKEN,
      });
      exports.push(AUTH_REPO_TOKEN);
    }

    if (includeEvents) {
      imports.push(PrismaEventsStoreModule);
    }

    if (includeTransactions) {
      providers.push({
        provide: TRANSACTION_PORT_TOKEN,
        useExisting: PRISMA_TRANSACTION_PORT_TOKEN,
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
