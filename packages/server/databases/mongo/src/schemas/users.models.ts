import { ModelDefinition } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddressDocument, AddressSchema } from './address.schema';
import {
  EmailVerificationTokenDocument,
  EmailVerificationTokenSchema,
} from './email-verification-token.schema';
import { PasswordResetTokenDocument, PasswordResetTokenSchema } from './password-reset-token.schema';
import { UserAuthProviderDocument, UserAuthProviderSchema } from './user-auth-provider.schema';
import { UserDocument, UserSchema } from './user.schema';
import { UserPreferenceDocument, UserPreferenceSchema } from './user-preference.schema';
import { UserSessionDocument, UserSessionSchema } from './user-session.schema';

export const USERS_MODEL_NAMES = {
  user: 'User',
  address: 'Address',
  userAuthProvider: 'UserAuthProvider',
  userPreference: 'UserPreference',
  userSession: 'UserSession',
  passwordResetToken: 'PasswordResetToken',
  emailVerificationToken: 'EmailVerificationToken',
} as const;

export interface UserModels {
  user: Model<UserDocument>;
  address: Model<AddressDocument>;
  userAuthProvider: Model<UserAuthProviderDocument>;
  userPreference: Model<UserPreferenceDocument>;
  userSession: Model<UserSessionDocument>;
  passwordResetToken: Model<PasswordResetTokenDocument>;
  emailVerificationToken: Model<EmailVerificationTokenDocument>;
}

export const USERS_MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    name: USERS_MODEL_NAMES.user,
    schema: UserSchema,
    collection: 'users',
  },
  {
    name: USERS_MODEL_NAMES.address,
    schema: AddressSchema,
    collection: 'addresses',
  },
  {
    name: USERS_MODEL_NAMES.userAuthProvider,
    schema: UserAuthProviderSchema,
    collection: 'user_auth_providers',
  },
  {
    name: USERS_MODEL_NAMES.userPreference,
    schema: UserPreferenceSchema,
    collection: 'user_preferences',
  },
  {
    name: USERS_MODEL_NAMES.userSession,
    schema: UserSessionSchema,
    collection: 'user_sessions',
  },
  {
    name: USERS_MODEL_NAMES.passwordResetToken,
    schema: PasswordResetTokenSchema,
    collection: 'password_reset_tokens',
  },
  {
    name: USERS_MODEL_NAMES.emailVerificationToken,
    schema: EmailVerificationTokenSchema,
    collection: 'email_verification_tokens',
  },
];
