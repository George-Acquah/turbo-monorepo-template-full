import { describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import type { EventPublisherPort, MemberProfileRepositoryPort, TransactionPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { CompleteOnboardingUseCase } from '../../../../src/application/member-profile/use-cases/complete-onboarding.use-case';

describe('CompleteOnboardingUseCase', () => {
  let repo: ReturnType<typeof createMock<Pick<MemberProfileRepositoryPort, 'findByUserId' | 'update'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let useCase: CompleteOnboardingUseCase;

  beforeEach(() => {
    repo = createMock(['findByUserId', 'update']);
    publisher = createMock(['publishWithTransaction']);
    transactionPort = createMock(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) => op(undefined)) as never);

    useCase = new CompleteOnboardingUseCase(
      repo as unknown as MemberProfileRepositoryPort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
    );
  });

  it('throws NotFound when the user has no linked profile', async () => {
    repo.findByUserId.mockResolvedValue(null);
    await expect(useCase.execute('usr_1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('stamps metadata.onboardedAt and publishes PROFILE_UPDATED on first completion', async () => {
    repo.findByUserId.mockResolvedValue({ id: 'prf_1', metadata: { source: 'ig' } } as never);
    repo.update.mockImplementation(((_id: string, data: Record<string, unknown>) =>
      Promise.resolve({ id: 'prf_1', ...data })) as never);

    await useCase.execute('usr_1');

    const [, data] = repo.update.mock.calls[0] as [string, { metadata: Record<string, unknown> }];
    expect(data.metadata.source).toBe('ig');
    expect(typeof data.metadata.onboardedAt).toBe('string');
    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ eventType: 'workspace.profiles.profile.updated' }),
    );
  });

  it('is a no-op when already onboarded', async () => {
    repo.findByUserId.mockResolvedValue({
      id: 'prf_1',
      metadata: { onboardedAt: '2026-01-01T00:00:00.000Z' },
    } as never);

    await useCase.execute('usr_1');

    expect(repo.update).not.toHaveBeenCalled();
    expect(publisher.publishWithTransaction).not.toHaveBeenCalled();
  });
});
