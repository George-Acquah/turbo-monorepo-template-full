import { Schema } from 'mongoose';

export interface UserDocument {
  _id: string;
  email?: string | null;
  phone?: string | null;
  supabase_id?: string | null;
  role: string;
  status: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  email_verified_at?: Date | null;
  phone_verified_at?: Date | null;
  password_hash?: string | null;
  last_login_at?: Date | null;
  last_login_ip?: string | null;
  failed_login_count: number;
  locked_until?: Date | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
  supabase_created_at?: Date | null;
  supabase_updated_at?: Date | null;
  supabase_deleted_at?: Date | null;
  updated_at: Date;
  deleted_at?: Date | null;
}

export const UserSchema = new Schema<UserDocument>(
  {
    _id: { type: String, required: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    supabase_id: { type: String, default: null },
    role: { type: String, default: 'CUSTOMER', required: true },
    status: { type: String, default: 'PENDING_VERIFICATION', required: true },
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    display_name: { type: String, default: null },
    avatar_url: { type: String, default: null },
    email_verified: { type: Boolean, default: false, required: true },
    phone_verified: { type: Boolean, default: false, required: true },
    email_verified_at: { type: Date, default: null },
    phone_verified_at: { type: Date, default: null },
    password_hash: { type: String, default: null },
    last_login_at: { type: Date, default: null },
    last_login_ip: { type: String, default: null },
    failed_login_count: { type: Number, default: 0, required: true },
    locked_until: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: () => new Date(), required: true },
    supabase_created_at: { type: Date, default: null },
    supabase_updated_at: { type: Date, default: null },
    supabase_deleted_at: { type: Date, default: null },
    updated_at: { type: Date, default: () => new Date(), required: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    collection: 'users',
  },
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ supabase_id: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ created_at: 1 });
