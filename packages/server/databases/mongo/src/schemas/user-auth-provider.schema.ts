import { Schema } from 'mongoose';

export interface UserAuthProviderDocument {
  _id: string;
  user_id: string;
  provider: string;
  provider_id: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: Date | null;
  token_data?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export const UserAuthProviderSchema = new Schema<UserAuthProviderDocument>(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true },
    provider: { type: String, required: true },
    provider_id: { type: String, required: true },
    access_token: { type: String, default: null },
    refresh_token: { type: String, default: null },
    expires_at: { type: Date, default: null },
    token_data: { type: Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: () => new Date(), required: true },
    updated_at: { type: Date, default: () => new Date(), required: true },
  },
  {
    versionKey: false,
    collection: 'user_auth_providers',
  },
);

UserAuthProviderSchema.index({ provider: 1, provider_id: 1 }, { unique: true });
UserAuthProviderSchema.index({ user_id: 1 });
