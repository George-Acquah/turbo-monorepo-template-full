import { HydratedDocument, Schema } from 'mongoose';

export interface PushDevicePersistence {
  id: string;
  userId: string;
  token: string;
  platform: string;
  deviceId?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  isActive: boolean;
  lastActiveAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PushDeviceDocument = HydratedDocument<PushDevicePersistence>;

export const PushDeviceModelName = 'PushDevice';

export const PushDeviceSchema = new Schema<PushDevicePersistence>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, required: true },
    deviceId: String,
    deviceModel: String,
    osVersion: String,
    appVersion: String,
    isActive: { type: Boolean, required: true, default: true, index: true },
    lastActiveAt: Date,
  },
  {
    collection: 'push_devices',
    timestamps: true,
    versionKey: false,
  },
);

PushDeviceSchema.index({ userId: 1, isActive: 1 });
