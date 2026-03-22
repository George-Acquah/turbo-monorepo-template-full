import { PushDeviceRecord, UpsertPushDeviceInput } from './notification.types';

export abstract class PushDeviceStorePort {
  abstract upsert(data: UpsertPushDeviceInput): Promise<PushDeviceRecord>;
  abstract listActiveForUser(userId: string): Promise<PushDeviceRecord[]>;
  abstract deactivate(token: string): Promise<void>;
}

export const PUSH_DEVICE_STORE_TOKEN = Symbol('PUSH_DEVICE_STORE_TOKEN');
