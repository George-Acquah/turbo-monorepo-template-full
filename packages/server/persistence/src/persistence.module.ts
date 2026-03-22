import { DynamicModule, Global, Module, type Provider, type Type } from '@nestjs/common';
import {
  AUTH_REPO_TOKEN,
  PRISMA_AUTH_REPO_TOKEN,
  PRISMA_TRANSACTION_PORT_TOKEN,
  TRANSACTION_PORT_TOKEN,
} from '@repo/ports';
import { MongoNotificationsStoreModule, MongoSearchStoreModule } from '@repo/mongo';
import {
  PrismaAuthStoreModule,
  PrismaAuditStoreModule,
  PrismaEventsStoreModule,
  PrismaFilesStoreModule,
  PrismaModule,
  PrismaPaymentsStoreModule,
} from '@repo/prisma';

export interface PersistenceModuleOptions {
  users?: boolean;
  auth?: boolean;
  events?: boolean;
  audit?: boolean;
  files?: boolean;
  payments?: boolean;
  notifications?: boolean;
  search?: boolean;
  transactions?: boolean;
}

@Global()
@Module({})
export class PersistenceModule {
  static forRoot(options: PersistenceModuleOptions = {}): DynamicModule {
    const includeUsers = options.users ?? options.auth ?? false;
    const includeEvents = options.events ?? false;
    const includeAudit = options.audit ?? false;
    const includeFiles = options.files ?? false;
    const includePayments = options.payments ?? false;
    const includeNotifications = options.notifications ?? false;
    const includeSearch = options.search ?? false;
    const includeTransactions = options.transactions ?? true;

    const imports: Array<Type<unknown> | DynamicModule> = [];
    const providers: Provider[] = [];
    const exports: symbol[] = [];

    if (
      includeUsers ||
      includeEvents ||
      includeAudit ||
      includeFiles ||
      includePayments ||
      includeTransactions
    ) {
      imports.push(PrismaModule);
    }

    if (includeUsers) {
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

    if (includeAudit) {
      imports.push(PrismaAuditStoreModule);
    }

    if (includeFiles) {
      imports.push(PrismaFilesStoreModule);
    }

    if (includePayments) {
      imports.push(PrismaPaymentsStoreModule);
    }

    if (includeNotifications) {
      imports.push(MongoNotificationsStoreModule);
    }

    if (includeSearch) {
      imports.push(MongoSearchStoreModule);
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
