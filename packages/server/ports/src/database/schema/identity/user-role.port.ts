import { DatabaseTx } from '../shared';
import {
  UserRolePersistence,
  CreateUserRoleInput,
  RevokeUserRoleInput,
  UserRoleWithRolePersistence,
} from './identity.types';

export abstract class UserRoleRepositoryPort {
  abstract assign(data: CreateUserRoleInput, tx?: DatabaseTx): Promise<UserRolePersistence>;

  /**
   * Revokes a role assignment.
   */
  abstract revoke(
    userId: string,
    data: RevokeUserRoleInput,
    tx?: DatabaseTx,
  ): Promise<UserRolePersistence>;

  /**
   * Main permission resolution hot path: fetches active (non-revoked,
   * non-expired) role assignments for a user, single-tenant.
   */
  abstract findActiveAssignments(
    userId: string,
    tx?: DatabaseTx,
  ): Promise<UserRoleWithRolePersistence[]>;
}

export const USER_ROLE_REPOSITORY_TOKEN = Symbol('USER_ROLE_REPOSITORY_TOKEN');
export const PRISMA_USER_ROLE_REPOSITORY_TOKEN = Symbol('PRISMA_USER_ROLE_REPOSITORY_TOKEN');
