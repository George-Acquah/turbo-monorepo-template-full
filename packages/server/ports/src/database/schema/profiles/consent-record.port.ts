import { DatabaseTx } from '../shared';
import {
  ConsentRecordPersistence,
  CreateConsentRecordInput,
  ConsentRecordPersistenceQueryOptions,
} from './profiles.types';

export abstract class ConsentRecordRepositoryPort {
  abstract create(
    data: CreateConsentRecordInput,
    tx?: DatabaseTx,
  ): Promise<ConsentRecordPersistence>;

  //Reads

  abstract findByProfile<K extends keyof ConsentRecordPersistence = keyof ConsentRecordPersistence>(
    profileId: string,
    options?: ConsentRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<ConsentRecordPersistence, K>[]>;

  /**
   * Latest recorded decision for a (profile, kind) pair.
   */
  abstract findLatest<K extends keyof ConsentRecordPersistence = keyof ConsentRecordPersistence>(
    profileId: string,
    kind: ConsentRecordPersistence['kind'],
    options?: ConsentRecordPersistenceQueryOptions<K>,
  ): Promise<Pick<ConsentRecordPersistence, K> | null>;
}

export const CONSENT_RECORD_REPOSITORY_TOKEN = Symbol('CONSENT_RECORD_REPOSITORY_TOKEN');
export const PRISMA_CONSENT_RECORD_REPOSITORY_TOKEN = Symbol(
  'PRISMA_CONSENT_RECORD_REPOSITORY_TOKEN',
);
