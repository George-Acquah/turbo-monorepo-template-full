import type { TradingExperience, ConsentKind } from '@workspace/constants';
import type { MemberProfilePersistence } from '@workspace/ports';
import type { MemberProfile as PrismaMemberProfile, ConsentRecord as PrismaConsentRecord } from '@workspace/prisma/client';

// MemberProfile.experience and ConsentRecord.kind are String columns with a
// /// @check doc-comment (not native Prisma enums), so they need the same
// narrowing UserConverter does for auth.User.userType/status.
export const MemberProfileConverter = {
  toPersistence(row: PrismaMemberProfile): MemberProfilePersistence {
    return {
      ...row,
      experience: row.experience as TradingExperience | null,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };
  },

  toPartialPersistence(row: Partial<PrismaMemberProfile>): Partial<MemberProfilePersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('experience' in row) result.experience = row.experience as TradingExperience | null;
    if ('metadata' in row) result.metadata = (row.metadata as Record<string, unknown> | null) ?? null;
    return result;
  },

  consentKindOf(row: PrismaConsentRecord): ConsentKind {
    return row.kind as ConsentKind;
  },
};
