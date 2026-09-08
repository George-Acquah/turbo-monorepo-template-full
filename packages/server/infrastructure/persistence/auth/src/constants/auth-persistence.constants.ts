import { Currency, ThemePreference } from '@workspace/constants';
import type { CreateUserPreferenceInput } from '@workspace/ports';

// Defaults applied when a UserPreference row is created alongside a new User
// (see transactions/auth.transaction.ts withUserCreation). Matches
// auth.prisma's UserPreference column defaults exactly.
export const DEFAULT_USER_PREFERENCES: Omit<CreateUserPreferenceInput, 'userId'> = {
  language: 'en',
  timezone: 'UTC',
  currency: Currency.GHS,
  darkMode: false,
  theme: ThemePreference.SYSTEM,
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  preferences: null,
};
