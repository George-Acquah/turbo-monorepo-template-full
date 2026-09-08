import { Module } from '@nestjs/common';
import { ProfilesPersistenceModule } from '@workspace/profiles-persistence';
import { ProfileResolverService } from './services/profile-resolver.service';

/**
 * Any consumer needing "which profile does this authenticated user own"
 * without depending on `modules/profiles` directly just does
 * `imports: [ProfileContextModule]` — same pattern as `@workspace/permissions`'
 * `PermissionsModule`.
 */
@Module({
  imports: [ProfilesPersistenceModule],
  providers: [ProfileResolverService],
  exports: [ProfileResolverService],
})
export class ProfileContextModule {}
