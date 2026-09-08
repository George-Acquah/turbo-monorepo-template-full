import { DatabaseTx } from '../shared';
import {
  MemberProfilePersistence,
  CreateMemberProfileInput,
  UpdateMemberProfileInput,
  MemberProfilePersistenceQueryOptions,
} from './profiles.types';

export abstract class MemberProfileRepositoryPort {
  abstract create(
    data: CreateMemberProfileInput,
    tx?: DatabaseTx,
  ): Promise<MemberProfilePersistence>;

  abstract update(
    id: string,
    data: UpdateMemberProfileInput,
    tx?: DatabaseTx,
  ): Promise<MemberProfilePersistence>;

  /**
   * Links a claimed account to its guest-checkout profile.
   */
  abstract linkUser(id: string, userId: string, tx?: DatabaseTx): Promise<MemberProfilePersistence>;

  abstract softDelete(id: string, tx?: DatabaseTx): Promise<void>;

  //Reads

  abstract findById<K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence>(
    id: string,
    options?: MemberProfilePersistenceQueryOptions<K>,
  ): Promise<Pick<MemberProfilePersistence, K> | null>;

  abstract findByEmail<K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence>(
    email: string,
    options?: MemberProfilePersistenceQueryOptions<K>,
  ): Promise<Pick<MemberProfilePersistence, K> | null>;

  abstract findByUserId<K extends keyof MemberProfilePersistence = keyof MemberProfilePersistence>(
    userId: string,
    options?: MemberProfilePersistenceQueryOptions<K>,
  ): Promise<Pick<MemberProfilePersistence, K> | null>;

  /**
   * Keyset-paginated sweep over every non-deleted profile — the bulk-listing
   * primitive `modules/notifications`' catalog-creation broadcast fan-out
   * needs (page through the whole member base without a single unbounded
   * query). Ordered by `id` ascending; pass the last page's final `id` as
   * `afterId` to continue.
   */
  abstract listActive(input: {
    afterId?: string;
    limit: number;
  }): Promise<Array<Pick<MemberProfilePersistence, 'id' | 'userId'>>>;
}

export const MEMBER_PROFILE_REPOSITORY_TOKEN = Symbol('MEMBER_PROFILE_REPOSITORY_TOKEN');
export const PRISMA_MEMBER_PROFILE_REPOSITORY_TOKEN = Symbol(
  'PRISMA_MEMBER_PROFILE_REPOSITORY_TOKEN',
);
