import type { Currency, ThemePreference } from '@workspace/constants';
import type { UserPreferencePersistence } from '@workspace/ports';
import type { UserPreference as PrismaUserPreference } from '@workspace/prisma/client';

// `theme`/`currency` are String columns with /// @check doc-comments rather than native Prisma
// enums, so they need the same narrowing UserConverter does for user_type/status.
export const UserPreferenceConverter = {
  toPersistence(row: PrismaUserPreference): UserPreferencePersistence {
    return {
      ...row,
      theme: row.theme as ThemePreference,
      currency: row.currency as Currency,
      preferences: (row.preferences as Record<string, unknown> | null) ?? null,
    };
  },
};
