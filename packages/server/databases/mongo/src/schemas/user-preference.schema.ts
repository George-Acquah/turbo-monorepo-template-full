import { Schema } from 'mongoose';

export interface UserPreferenceDocument {
  _id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  language: string;
  currency: string;
  timezone: string;
  dark_mode: boolean;
  preferences?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export const UserPreferenceSchema = new Schema<UserPreferenceDocument>(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true },
    email_notifications: { type: Boolean, default: true, required: true },
    sms_notifications: { type: Boolean, default: true, required: true },
    push_notifications: { type: Boolean, default: true, required: true },
    marketing_emails: { type: Boolean, default: false, required: true },
    language: { type: String, default: 'en', required: true },
    currency: { type: String, default: 'GHS', required: true },
    timezone: { type: String, default: 'Africa/Accra', required: true },
    dark_mode: { type: Boolean, default: false, required: true },
    preferences: { type: Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: () => new Date(), required: true },
    updated_at: { type: Date, default: () => new Date(), required: true },
  },
  {
    versionKey: false,
    collection: 'user_preferences',
  },
);

UserPreferenceSchema.index({ user_id: 1 }, { unique: true });
