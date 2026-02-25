import { Schema } from 'mongoose';

export interface UserSessionDocument {
  _id: string;
  user_id: string;
  refresh_token_hash: string;
  jti: string;
  device_id: string;
  device_info?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: Date;
  last_active_at?: Date | null;
  created_at: Date;
}

export const UserSessionSchema = new Schema<UserSessionDocument>(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true },
    refresh_token_hash: { type: String, required: true },
    jti: { type: String, required: true },
    device_id: { type: String, required: true },
    device_info: { type: String, default: null },
    ip_address: { type: String, default: null },
    user_agent: { type: String, default: null },
    expires_at: { type: Date, required: true },
    last_active_at: { type: Date, default: null },
    created_at: { type: Date, default: () => new Date(), required: true },
  },
  {
    versionKey: false,
    collection: 'user_sessions',
  },
);

UserSessionSchema.index({ refresh_token_hash: 1 }, { unique: true });
UserSessionSchema.index({ user_id: 1, device_id: 1 }, { unique: true });
UserSessionSchema.index({ user_id: 1 });
UserSessionSchema.index({ device_id: 1 });
UserSessionSchema.index({ expires_at: 1 });
