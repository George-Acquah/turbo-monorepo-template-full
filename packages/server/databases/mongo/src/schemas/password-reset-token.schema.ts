import { Schema } from 'mongoose';

export interface PasswordResetTokenDocument {
  _id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used_at?: Date | null;
  created_at: Date;
}

export const PasswordResetTokenSchema = new Schema<PasswordResetTokenDocument>(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true },
    token: { type: String, required: true },
    expires_at: { type: Date, required: true },
    used_at: { type: Date, default: null },
    created_at: { type: Date, default: () => new Date(), required: true },
  },
  {
    versionKey: false,
    collection: 'password_reset_tokens',
  },
);

PasswordResetTokenSchema.index({ token: 1 }, { unique: true });
PasswordResetTokenSchema.index({ user_id: 1 });
PasswordResetTokenSchema.index({ expires_at: 1 });
