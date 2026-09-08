import { DatabaseTx } from '../shared';
import {
  PermissionPersistence,
  PermissionPersistenceQueryOptions,
  CreatePermissionInput,
  UpdatePermissionInput,
} from './identity.types';

export abstract class PermissionRepositoryPort {
  //Writes
  abstract create(data: CreatePermissionInput, tx?: DatabaseTx): Promise<PermissionPersistence>;

  abstract update(
    id: string,
    data: UpdatePermissionInput,
    tx?: DatabaseTx,
  ): Promise<PermissionPersistence>;

  abstract upsertMany(permissions: CreatePermissionInput[], tx?: DatabaseTx): Promise<void>;

  //Reads
  abstract findById<K extends keyof PermissionPersistence = keyof PermissionPersistence>(
    id: string,
    options?: PermissionPersistenceQueryOptions<K>,
  ): Promise<Pick<PermissionPersistence, K> | null>;

  abstract findByKey<K extends keyof PermissionPersistence = keyof PermissionPersistence>(
    key: string,
    options?: PermissionPersistenceQueryOptions<K>,
  ): Promise<Pick<PermissionPersistence, K> | null>;

  abstract findMany<K extends keyof PermissionPersistence = keyof PermissionPersistence>(
    params: {
      resource?: string;
      isActive?: boolean;
    },
    options?: PermissionPersistenceQueryOptions<K>,
    tx?: DatabaseTx,
  ): Promise<Pick<PermissionPersistence, K>[]>;
}

export const PERMISSION_REPOSITORY_TOKEN = Symbol('PERMISSION_REPOSITORY_TOKEN');
export const PRISMA_PERMISSION_REPOSITORY_TOKEN = Symbol('PRISMA_PERMISSION_REPOSITORY_TOKEN');
