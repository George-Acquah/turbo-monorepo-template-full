import type { UserType, UserStatus } from '@workspace/constants';
import type {
  UserPersistence,
  CreateUserInput,
  UpdateUserProfileInput,
  UpdateUserSecurityInput,
} from '@workspace/ports';
import { Prisma, type User as PrismaUser } from '@workspace/prisma/client';

/**
 * The only auth entity needing real field-level conversion: Prisma types
 * userType/status as plain `string` (they're String columns with a /// @check
 * doc-comment, not native Prisma enums) while UserPersistence narrows them to
 * the UserType/UserStatus literal unions from @workspace/constants. Every
 * other auth entity's Prisma row shape already matches its *Persistence
 * interface field-for-field, so no converter is needed for them.
 */
export const UserConverter = {
  toPersistence(row: PrismaUser): UserPersistence {
    return {
      ...row,
      userType: row.userType as UserType,
      status: row.status as UserStatus,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };
  },

  /**
   * For select-projected reads, where Prisma returns only the requested
   * subset of columns. Only re-narrows userType/status/metadata when those
   * particular fields were actually selected — everything else passes
   * through untouched, since the port's Pick<UserPersistence, K> return type
   * is asserted at the adapter boundary regardless (see the port's own
   * EntitySelectPath doc-comment on this trade-off).
   */
  toPartialPersistence(row: Partial<PrismaUser>): Partial<UserPersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('userType' in row) result.userType = row.userType as UserType;
    if ('status' in row) result.status = row.status as UserStatus;
    if ('metadata' in row) result.metadata = (row.metadata as Record<string, unknown> | null) ?? null;
    return result;
  },

  toCreateData(input: CreateUserInput, id: string): Prisma.UserCreateInput {
    const { id: _ignored, metadata, ...rest } = input;
    return {
      id,
      ...rest,
      metadata: metadata === null ? Prisma.JsonNull : (metadata as Prisma.InputJsonValue),
    };
  },

  toProfileUpdateData(input: UpdateUserProfileInput): Prisma.UserUpdateInput {
    const { metadata, ...rest } = input;
    return {
      ...rest,
      ...(metadata === undefined
        ? {}
        : { metadata: metadata === null ? Prisma.JsonNull : (metadata as Prisma.InputJsonValue) }),
    };
  },

  toSecurityUpdateData(input: UpdateUserSecurityInput): Prisma.UserUpdateInput {
    return { ...input };
  },
};
