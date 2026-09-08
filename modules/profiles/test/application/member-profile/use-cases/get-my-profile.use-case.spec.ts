import { describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import type { MemberProfileRepositoryPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { GetMyProfileUseCase } from '../../../../src/application/member-profile/use-cases/get-my-profile.use-case';

describe('GetMyProfileUseCase', () => {
  let memberProfileRepo: ReturnType<typeof createMock<Pick<MemberProfileRepositoryPort, 'findByUserId'>>>;
  let useCase: GetMyProfileUseCase;

  beforeEach(() => {
    memberProfileRepo = createMock<Pick<MemberProfileRepositoryPort, 'findByUserId'>>([
      'findByUserId',
    ]);
    useCase = new GetMyProfileUseCase(memberProfileRepo as unknown as MemberProfileRepositoryPort);
  });

  it('returns the profile linked to the caller', async () => {
    memberProfileRepo.findByUserId.mockResolvedValue({ id: 'prf_1', email: 'a@b.com' } as never);

    const result = await useCase.execute('usr_1');

    expect(result).toEqual({ id: 'prf_1', email: 'a@b.com' });
    expect(memberProfileRepo.findByUserId).toHaveBeenCalledWith('usr_1');
  });

  it('throws NotFound when the user has no linked profile (e.g. staff/admin)', async () => {
    memberProfileRepo.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('usr_staff')).rejects.toBeInstanceOf(NotFoundException);
  });
});
