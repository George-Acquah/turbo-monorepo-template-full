import { DatabaseTx } from '../shared';
import {
  CreateCommunicationPreferenceOverrideInput,
  CommunicationPreferenceOverridePersistence,
  CommunicationPreferenceOverridePersistenceQueryOptions,
} from './notification.types';

export abstract class CommunicationPreferenceOverrideRepositoryPort {
  abstract create<
    K extends keyof CommunicationPreferenceOverridePersistence =
      keyof CommunicationPreferenceOverridePersistence,
  >(
    data: CreateCommunicationPreferenceOverrideInput,
    tx?: DatabaseTx,
    options?: CommunicationPreferenceOverridePersistenceQueryOptions<K>,
  ): Promise<Pick<CommunicationPreferenceOverridePersistence, K>>;

  abstract findActiveOverrides<
    K extends keyof CommunicationPreferenceOverridePersistence =
      keyof CommunicationPreferenceOverridePersistence,
  >(
    category: string,
    tx?: DatabaseTx,
    options?: CommunicationPreferenceOverridePersistenceQueryOptions<K>,
  ): Promise<Pick<CommunicationPreferenceOverridePersistence, K>[]>;

  abstract expire(id: string, tx?: DatabaseTx): Promise<void>;
}

export const COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN = Symbol(
  'COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN',
);
export const PRISMA_COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN = Symbol(
  'PRISMA_COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN',
);
