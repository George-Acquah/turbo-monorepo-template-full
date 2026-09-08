import { describe, it, expect, beforeEach } from '@jest/globals';
import type { CachePort, MemberProfileRepositoryPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { ProfileResolverService } from '../../src/services/profile-resolver.service';

describe('ProfileResolverService', () => {
  let memberProfileRepo: ReturnType<typeof createMock<Pick<MemberProfileRepositoryPort, 'findByUserId'>>>;
  let cache: ReturnType<typeof createMock<Pick<CachePort, 'getOrSetEntity'>>>;
  let service: ProfileResolverService;

  beforeEach(() => {
    memberProfileRepo = createMock<Pick<MemberProfileRepositoryPort, 'findByUserId'>>([
      'findByUserId',
    ]);
    cache = createMock<Pick<CachePort, 'getOrSetEntity'>>(['getOrSetEntity']);
    // Cache-miss passthrough for every test — exercises the real factory logic.
    cache.getOrSetEntity.mockImplementation(((_prefix: string, _id: string, factory: () => unknown) =>
      factory()) as never);

    service = new ProfileResolverService(
      memberProfileRepo as unknown as MemberProfileRepositoryPort,
      cache as unknown as CachePort,
    );
  });

  it('resolves the profileId owned by a member userId', async () => {
    memberProfileRepo.findByUserId.mockResolvedValue({ id: 'prf_1' } as never);

    await expect(service.resolveProfileId('usr_1')).resolves.toBe('prf_1');
  });

  it('returns undefined for a userId with no MemberProfile (e.g. staff/admin)', async () => {
    memberProfileRepo.findByUserId.mockResolvedValue(null);

    await expect(service.resolveProfileId('usr_staff')).resolves.toBeUndefined();
  });
});
