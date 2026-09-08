import type { Provider } from '@nestjs/common';
import {
  PERMISSION_REPOSITORY_TOKEN,
  PRISMA_PERMISSION_REPOSITORY_TOKEN,
  ROLE_REPOSITORY_TOKEN,
  PRISMA_ROLE_REPOSITORY_TOKEN,
  USER_ROLE_REPOSITORY_TOKEN,
  PRISMA_USER_ROLE_REPOSITORY_TOKEN,
  API_CLIENT_REPOSITORY_TOKEN,
  PRISMA_API_CLIENT_REPOSITORY_TOKEN,
  API_KEY_REPOSITORY_TOKEN,
  PRISMA_API_KEY_REPOSITORY_TOKEN,
} from '@workspace/ports';
import {
  PrismaPermissionAdapter,
  PrismaRoleAdapter,
  PrismaUserRoleAdapter,
  PrismaApiClientAdapter,
  PrismaApiKeyAdapter,
} from '../adapters';

export const IDENTITY_PERSISTENCE_ADAPTERS: Provider[] = [
  PrismaPermissionAdapter,
  { provide: PRISMA_PERMISSION_REPOSITORY_TOKEN, useExisting: PrismaPermissionAdapter },
  { provide: PERMISSION_REPOSITORY_TOKEN, useExisting: PrismaPermissionAdapter },

  PrismaRoleAdapter,
  { provide: PRISMA_ROLE_REPOSITORY_TOKEN, useExisting: PrismaRoleAdapter },
  { provide: ROLE_REPOSITORY_TOKEN, useExisting: PrismaRoleAdapter },

  PrismaUserRoleAdapter,
  { provide: PRISMA_USER_ROLE_REPOSITORY_TOKEN, useExisting: PrismaUserRoleAdapter },
  { provide: USER_ROLE_REPOSITORY_TOKEN, useExisting: PrismaUserRoleAdapter },

  PrismaApiClientAdapter,
  { provide: PRISMA_API_CLIENT_REPOSITORY_TOKEN, useExisting: PrismaApiClientAdapter },
  { provide: API_CLIENT_REPOSITORY_TOKEN, useExisting: PrismaApiClientAdapter },

  PrismaApiKeyAdapter,
  { provide: PRISMA_API_KEY_REPOSITORY_TOKEN, useExisting: PrismaApiKeyAdapter },
  { provide: API_KEY_REPOSITORY_TOKEN, useExisting: PrismaApiKeyAdapter },
];

export const IDENTITY_PERSISTENCE_TOKENS = [
  PERMISSION_REPOSITORY_TOKEN,
  ROLE_REPOSITORY_TOKEN,
  USER_ROLE_REPOSITORY_TOKEN,
  API_CLIENT_REPOSITORY_TOKEN,
  API_KEY_REPOSITORY_TOKEN,
];
