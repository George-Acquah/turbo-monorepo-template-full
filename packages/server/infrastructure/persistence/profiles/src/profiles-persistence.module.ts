import { Module } from '@nestjs/common';
import { PrismaModule } from '@workspace/prisma';
import { MemberProfileQuery } from './queries';
import { PROFILES_PERSISTENCE_ADAPTERS, PROFILES_PERSISTENCE_TOKENS } from './providers';

export * from './queries';
export * from './converter';
export * from './adapters';

/**
 * Implements the workspace_profiles ports (MemberProfile, ConsentRecord)
 * against Prisma. MemberProfile is the guest-checkout aggregate — it can
 * exist before a User does.
 */
@Module({
  imports: [PrismaModule],
  providers: [MemberProfileQuery, ...PROFILES_PERSISTENCE_ADAPTERS],
  exports: [...PROFILES_PERSISTENCE_TOKENS],
})
export class ProfilesPersistenceModule {}
