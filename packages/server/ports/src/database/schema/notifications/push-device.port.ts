import { DatabaseTx } from '../shared';
import {
  PushDevicePersistence,
  PushDevicePersistenceQueryOptions,
  RegisterPushDeviceInput,
} from './notification.types';

export abstract class PushDeviceRepositoryPort {
  abstract register<K extends keyof PushDevicePersistence = keyof PushDevicePersistence>(
    data: RegisterPushDeviceInput,
    tx?: DatabaseTx,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<PushDevicePersistence, K>>;

  abstract findById<K extends keyof PushDevicePersistence = keyof PushDevicePersistence>(
    id: string,
    tx?: DatabaseTx,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<PushDevicePersistence, K> | null>;

  abstract findByToken<K extends keyof PushDevicePersistence = keyof PushDevicePersistence>(
    token: string,
    tx?: DatabaseTx,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<PushDevicePersistence, K> | null>;

  abstract listUserDevices<K extends keyof PushDevicePersistence = keyof PushDevicePersistence>(
    userId: string,
    tx?: DatabaseTx,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<PushDevicePersistence, K>[]>;

  abstract listActiveUserDevices<
    K extends keyof PushDevicePersistence = keyof PushDevicePersistence,
  >(
    userId: string,
    tx?: DatabaseTx,
    options?: PushDevicePersistenceQueryOptions<K>,
  ): Promise<Pick<PushDevicePersistence, K>[]>;

  abstract markSeen(id: string, tx?: DatabaseTx): Promise<void>;

  abstract deactivate(id: string, tx?: DatabaseTx): Promise<void>;

  abstract reactivate(id: string, tx?: DatabaseTx): Promise<void>;
}

export const PUSH_DEVICE_REPOSITORY_TOKEN = Symbol('PUSH_DEVICE_REPOSITORY_TOKEN');
export const PRISMA_PUSH_DEVICE_REPOSITORY_TOKEN = Symbol('PRISMA_PUSH_DEVICE_REPOSITORY_TOKEN');
