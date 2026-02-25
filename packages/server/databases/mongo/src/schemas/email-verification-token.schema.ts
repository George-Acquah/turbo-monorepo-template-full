import { Schema } from 'mongoose';

export interface EmailVerificationTokenDocument {
  _id: string;
  user_id: string;
  email: string;
  token: string;
  expires_at: Date;
  used_at?: Date | null;
  created_at: Date;
}

export const EmailVerificationTokenSchema = new Schema<EmailVerificationTokenDocument>(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true },
    email: { type: String, required: true },
    token: { type: String, required: true },
    expires_at: { type: Date, required: true },
    used_at: { type: Date, default: null },
    created_at: { type: Date, default: () => new Date(), required: true },
  },
  {
    versionKey: false,
    collection: 'email_verification_tokens',
  },
);

EmailVerificationTokenSchema.index({ token: 1 }, { unique: true });
EmailVerificationTokenSchema.index({ user_id: 1 });
EmailVerificationTokenSchema.index({ expires_at: 1 });
