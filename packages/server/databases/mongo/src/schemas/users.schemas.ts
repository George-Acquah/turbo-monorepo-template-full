import { Connection, Model, Schema } from 'mongoose';

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

export interface AddressDocument {
  _id: string;
  user_id: string;
  label?: string | null;
  full_name: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  region?: string | null;
  postal_code?: string | null;
  country: string;
  phone?: string | null;
  is_default: boolean;
  is_shipping_default: boolean;
  is_billing_default: boolean;
  latitude?: unknown;
  longitude?: unknown;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

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

export interface PasswordResetTokenDocument {
  _id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used_at?: Date | null;
  created_at: Date;
}

export interface EmailVerificationTokenDocument {
  _id: string;
  user_id: string;
  email: string;
  token: string;
  expires_at: Date;
  used_at?: Date | null;
  created_at: Date;
}

export interface UserModels {
  user: Model<UserDocument>;
  address: Model<AddressDocument>;
  userAuthProvider: Model<UserAuthProviderDocument>;
  userPreference: Model<UserPreferenceDocument>;
  userSession: Model<UserSessionDocument>;
  passwordResetToken: Model<PasswordResetTokenDocument>;
  emailVerificationToken: Model<EmailVerificationTokenDocument>;
}

function getOrCreateModel<T>(
  connection: Connection,
  modelName: string,
  schema: Schema<T>,
  collectionName: string,
): Model<T> {
  const existing = connection.models[modelName] as Model<T> | undefined;
  if (existing) {
    return existing;
  }

  return connection.model<T>(modelName, schema, collectionName);
}

export function createUserModels(connection: Connection): UserModels {
  const userSchema = new Schema<UserDocument>(
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

  userSchema.index({ email: 1 }, { unique: true, sparse: true });
  userSchema.index({ phone: 1 }, { unique: true, sparse: true });
  userSchema.index({ supabase_id: 1 }, { unique: true, sparse: true });
  userSchema.index({ role: 1, status: 1 });
  userSchema.index({ created_at: 1 });

  const addressSchema = new Schema<AddressDocument>(
    {
      _id: { type: String, required: true },
      user_id: { type: String, required: true },
      label: { type: String, default: null },
      full_name: { type: String, required: true },
      address_line_1: { type: String, required: true },
      address_line_2: { type: String, default: null },
      city: { type: String, required: true },
      region: { type: String, default: null },
      postal_code: { type: String, default: null },
      country: { type: String, default: 'GH', required: true },
      phone: { type: String, default: null },
      is_default: { type: Boolean, default: false, required: true },
      is_shipping_default: { type: Boolean, default: false, required: true },
      is_billing_default: { type: Boolean, default: false, required: true },
      latitude: { type: Schema.Types.Decimal128, default: null },
      longitude: { type: Schema.Types.Decimal128, default: null },
      metadata: { type: Schema.Types.Mixed, default: null },
      created_at: { type: Date, default: () => new Date(), required: true },
      updated_at: { type: Date, default: () => new Date(), required: true },
      deleted_at: { type: Date, default: null },
    },
    {
      versionKey: false,
      collection: 'addresses',
    },
  );

  addressSchema.index({ user_id: 1 });
  addressSchema.index({ user_id: 1, is_default: 1 });

  const userAuthProviderSchema = new Schema<UserAuthProviderDocument>(
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

  userAuthProviderSchema.index({ provider: 1, provider_id: 1 }, { unique: true });
  userAuthProviderSchema.index({ user_id: 1 });

  const userPreferenceSchema = new Schema<UserPreferenceDocument>(
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

  userPreferenceSchema.index({ user_id: 1 }, { unique: true });

  const userSessionSchema = new Schema<UserSessionDocument>(
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

  userSessionSchema.index({ refresh_token_hash: 1 }, { unique: true });
  userSessionSchema.index({ user_id: 1, device_id: 1 }, { unique: true });
  userSessionSchema.index({ user_id: 1 });
  userSessionSchema.index({ device_id: 1 });
  userSessionSchema.index({ expires_at: 1 });

  const passwordResetTokenSchema = new Schema<PasswordResetTokenDocument>(
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

  passwordResetTokenSchema.index({ token: 1 }, { unique: true });
  passwordResetTokenSchema.index({ user_id: 1 });
  passwordResetTokenSchema.index({ expires_at: 1 });

  const emailVerificationTokenSchema = new Schema<EmailVerificationTokenDocument>(
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

  emailVerificationTokenSchema.index({ token: 1 }, { unique: true });
  emailVerificationTokenSchema.index({ user_id: 1 });
  emailVerificationTokenSchema.index({ expires_at: 1 });

  return {
    user: getOrCreateModel(connection, 'User', userSchema, 'users'),
    address: getOrCreateModel(connection, 'Address', addressSchema, 'addresses'),
    userAuthProvider: getOrCreateModel(
      connection,
      'UserAuthProvider',
      userAuthProviderSchema,
      'user_auth_providers',
    ),
    userPreference: getOrCreateModel(
      connection,
      'UserPreference',
      userPreferenceSchema,
      'user_preferences',
    ),
    userSession: getOrCreateModel(connection, 'UserSession', userSessionSchema, 'user_sessions'),
    passwordResetToken: getOrCreateModel(
      connection,
      'PasswordResetToken',
      passwordResetTokenSchema,
      'password_reset_tokens',
    ),
    emailVerificationToken: getOrCreateModel(
      connection,
      'EmailVerificationToken',
      emailVerificationTokenSchema,
      'email_verification_tokens',
    ),
  };
}
