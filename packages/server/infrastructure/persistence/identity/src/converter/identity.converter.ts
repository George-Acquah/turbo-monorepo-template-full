import type { ApiClientStatus, ApiKeyStatus } from '@workspace/constants';
import type { ApiClientPersistence, ApiKeyPersistence } from '@workspace/ports';
import type { ApiClient as PrismaApiClient, ApiKey as PrismaApiKey } from '@workspace/prisma/client';

// status is a String column with a /// @check doc-comment (not a native
// Prisma enum), so it needs the same narrowing UserConverter does for
// auth.User.userType/status.
export const IdentityConverter = {
  toApiClientPersistence(row: PrismaApiClient): ApiClientPersistence {
    return {
      ...row,
      status: row.status as ApiClientStatus,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };
  },

  toApiClientPartialPersistence(row: Partial<PrismaApiClient>): Partial<ApiClientPersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('status' in row) result.status = row.status as ApiClientStatus;
    if ('metadata' in row) result.metadata = (row.metadata as Record<string, unknown> | null) ?? null;
    return result;
  },

  toApiKeyPersistence(row: PrismaApiKey): ApiKeyPersistence {
    return { ...row, status: row.status as ApiKeyStatus };
  },

  toApiKeyPartialPersistence(row: Partial<PrismaApiKey>): Partial<ApiKeyPersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('status' in row) result.status = row.status as ApiKeyStatus;
    return result;
  },
};
