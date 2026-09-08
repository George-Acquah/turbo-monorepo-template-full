import { Inject, Injectable } from '@nestjs/common';
import {
  MEMBER_PROFILE_REPOSITORY_TOKEN,
  type MemberProfileRepositoryPort,
  CACHE_PORT_TOKEN,
  type CachePort,
} from '@workspace/ports';
import { CacheTTL, RedisKeyPrefixes } from '@workspace/constants';

/**
 * Resolves "which MemberProfile does this authenticated user own" from a
 * live, cached lookup keyed by userId — mirrors PermissionResolverService's
 * exact reasoning (`@workspace/permissions`): nothing bakes this into the
 * JWT, since a claim/re-link event can't retroactively update an
 * already-issued access token.
 *
 * Exists as its own `packages/server/*` package (not inside `modules/profiles`
 * or `modules/memberships`) because `modules/memberships` needs it and the
 * `buildContextBoundaryZones` ESLint rule forbids one `modules/{context}`
 * package from importing another's ports directly — only `packages/server/*`
 * is exempt from that restriction.
 *
 * Returns `undefined` for a userId with no MemberProfile at all (e.g. staff/
 * admin accounts, which are identity's concern, not profiles') — this is a
 * legitimate, common case, not an error.
 */
@Injectable()
export class ProfileResolverService {
  constructor(
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
    @Inject(CACHE_PORT_TOKEN) private readonly cache: CachePort,
  ) {}

  async resolveProfileId(userId: string): Promise<string | undefined> {
    const profileId = await this.cache.getOrSetEntity<string>(
      RedisKeyPrefixes.PROFILES.USER_PROFILE_ID,
      userId,
      async () => {
        const profile = await this.memberProfileRepo.findByUserId(userId, { select: ['id'] });
        return profile?.id ?? null;
      },
      { ttl: CacheTTL.EPHEMERAL },
    );
    return profileId ?? undefined;
  }
}
