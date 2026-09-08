import type { Provider } from '@nestjs/common';
import {
  MEMBER_PROFILE_REPOSITORY_TOKEN,
  PRISMA_MEMBER_PROFILE_REPOSITORY_TOKEN,
  CONSENT_RECORD_REPOSITORY_TOKEN,
  PRISMA_CONSENT_RECORD_REPOSITORY_TOKEN,
} from '@workspace/ports';
import { PrismaMemberProfileAdapter, PrismaConsentRecordAdapter } from '../adapters';

export const PROFILES_PERSISTENCE_ADAPTERS: Provider[] = [
  PrismaMemberProfileAdapter,
  { provide: PRISMA_MEMBER_PROFILE_REPOSITORY_TOKEN, useExisting: PrismaMemberProfileAdapter },
  { provide: MEMBER_PROFILE_REPOSITORY_TOKEN, useExisting: PrismaMemberProfileAdapter },

  PrismaConsentRecordAdapter,
  { provide: PRISMA_CONSENT_RECORD_REPOSITORY_TOKEN, useExisting: PrismaConsentRecordAdapter },
  { provide: CONSENT_RECORD_REPOSITORY_TOKEN, useExisting: PrismaConsentRecordAdapter },
];

export const PROFILES_PERSISTENCE_TOKENS = [
  MEMBER_PROFILE_REPOSITORY_TOKEN,
  CONSENT_RECORD_REPOSITORY_TOKEN,
];
