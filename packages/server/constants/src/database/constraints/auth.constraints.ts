import { enumConstraint } from '../builders';
import { Schemas, Tables } from '../postgres.constants';
import {
  AccountClaimTokenStatus,
  AuthProvider,
  InvitationStatus,
  ThemePreference,
  TwoFactorMethod,
  UserStatus,
  UserType,
} from '../../auth';
import { Currency } from '../../payments';

export const AuthConstraints = [
  enumConstraint({
    schema: Schemas.AUTH,
    table: Tables.USERS,
    column: 'user_type',
    values: UserType,
  }),
  enumConstraint({
    schema: Schemas.AUTH,
    table: Tables.USERS,
    column: 'status',
    values: UserStatus,
  }),
  enumConstraint({
    schema: Schemas.AUTH,
    table: Tables.USER_AUTH_PROVIDERS,
    column: 'provider',
    values: AuthProvider,
  }),
  enumConstraint({
    schema: Schemas.AUTH,
    table: Tables.PENDING_INVITATIONS,
    column: 'status',
    values: InvitationStatus,
  }),
  enumConstraint({
    schema: Schemas.AUTH,
    table: Tables.TWO_FACTOR_ENROLLMENTS,
    column: 'method',
    values: TwoFactorMethod,
  }),
  enumConstraint({
    schema: Schemas.AUTH,
    table: Tables.ACCOUNT_CLAIM_TOKENS,
    column: 'status',
    values: AccountClaimTokenStatus,
  }),
  enumConstraint({
    schema: Schemas.AUTH,
    table: Tables.USER_PREFERENCES,
    column: 'theme',
    values: ThemePreference,
  }),
  enumConstraint({
    schema: Schemas.AUTH,
    table: Tables.USER_PREFERENCES,
    column: 'currency',
    values: Currency,
    name: 'chk_user_preferences_currency',
  }),
] as const;
