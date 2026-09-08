import { describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import type { EventPublisherPort, MemberProfileRepositoryPort, TransactionPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { UpdateMyProfileUseCase } from '../../../../src/application/member-profile/use-cases/update-my-profile.use-case';

describe('UpdateMyProfileUseCase', () => {
  let memberProfileRepo: ReturnType<
    typeof createMock<Pick<MemberProfileRepositoryPort, 'findByUserId' | 'update'>>
  >;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let useCase: UpdateMyProfileUseCase;

  beforeEach(() => {
    memberProfileRepo = createMock<Pick<MemberProfileRepositoryPort, 'findByUserId' | 'update'>>([
      'findByUserId',
      'update',
    ]);
    publisher = createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>([
      'publishWithTransaction',
    ]);
    transactionPort = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) =>
      op(undefined)) as never);

    useCase = new UpdateMyProfileUseCase(
      memberProfileRepo as unknown as MemberProfileRepositoryPort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
    );
  });

  it('throws NotFound when the user has no linked profile', async () => {
    memberProfileRepo.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute('usr_staff', { firstName: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(memberProfileRepo.update).not.toHaveBeenCalled();
  });

  it('updates the profile and publishes PROFILE_UPDATED', async () => {
    memberProfileRepo.findByUserId.mockResolvedValue({ id: 'prf_1' } as never);
    memberProfileRepo.update.mockResolvedValue({ id: 'prf_1', firstName: 'Ama' } as never);

    const result = await useCase.execute('usr_1', { firstName: 'Ama' });

    expect(memberProfileRepo.update).toHaveBeenCalledWith('prf_1', { firstName: 'Ama' }, undefined);
    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        eventType: 'workspace.profiles.profile.updated',
        payload: expect.objectContaining({ profileId: 'prf_1', userId: 'usr_1' }),
      }),
    );
    expect(result).toEqual({ id: 'prf_1', firstName: 'Ama' });
  });
});
