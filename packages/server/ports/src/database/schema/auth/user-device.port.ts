import { DatabaseTx } from '../shared';
import {
  UserDevicePersistence,
  CreateUserDeviceInput,
  UpdateUserDeviceInput,
  UserDevicePersistenceQueryOptions,
} from './auth.types';

export abstract class UserDeviceRepositoryPort {
  abstract create(data: CreateUserDeviceInput, tx?: DatabaseTx): Promise<UserDevicePersistence>;

  abstract update(
    id: string,
    data: UpdateUserDeviceInput,
    tx?: DatabaseTx,
  ): Promise<UserDevicePersistence>;

  /**
   * Marks a device as trusted (skips MFA) or revokes trust.
   */
  abstract setDeviceTrust(
    id: string,
    trusted: boolean,
    trustedBy?: string,
    tx?: DatabaseTx,
  ): Promise<UserDevicePersistence>;

  //Reads

  abstract findById<K extends keyof UserDevicePersistence = keyof UserDevicePersistence>(
    id: string,
    options?: UserDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<UserDevicePersistence, K> | null>;

  /**
   * Locates a device registry entry using the browser/hardware fingerprint hash.
   */
  abstract findByFingerprint<K extends keyof UserDevicePersistence = keyof UserDevicePersistence>(
    userId: string,
    fingerprintHash: string,
    options?: UserDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<UserDevicePersistence, K> | null>;

  abstract findByUserId<K extends keyof UserDevicePersistence = keyof UserDevicePersistence>(
    userId: string,
    options?: UserDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<UserDevicePersistence, K>[]>;
}

export const USER_DEVICE_REPOSITORY_TOKEN = Symbol('USER_DEVICE_REPOSITORY_TOKEN');
export const PRISMA_USER_DEVICE_REPOSITORY_TOKEN = Symbol('PRISMA_USER_DEVICE_REPOSITORY_TOKEN');
