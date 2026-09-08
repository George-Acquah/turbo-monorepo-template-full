import { describe, it, expect, beforeEach } from '@jest/globals';
import type { EventPublisherPort, MemberProfileRepositoryPort, TransactionPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { CreateGuestProfileUseCase } from '../../../../src/application/member-profile/use-cases/create-guest-profile.use-case';

describe('CreateGuestProfileUseCase', () => {
  let memberProfileRepo: ReturnType<
    typeof createMock<Pick<MemberProfileRepositoryPort, 'findByEmail' | 'create'>>
  >;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let useCase: CreateGuestProfileUseCase;

  beforeEach(() => {
    memberProfileRepo = createMock<Pick<MemberProfileRepositoryPort, 'findByEmail' | 'create'>>([
      'findByEmail',
      'create',
    ]);
    publisher = createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>([
      'publishWithTransaction',
    ]);
    transactionPort = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) =>
      op(undefined)) as never);

    useCase = new CreateGuestProfileUseCase(
      memberProfileRepo as unknown as MemberProfileRepositoryPort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
    );
  });

  it('is idempotent on email — returns the existing profile without creating a duplicate', async () => {
    memberProfileRepo.findByEmail.mockResolvedValue({ id: 'prf_existing' } as never);

    const result = await useCase.execute({
      email: 'guest@example.com',
      firstName: 'Guest',
      lastName: 'User',
    });

    expect(result).toEqual({ id: 'prf_existing' });
    expect(memberProfileRepo.create).not.toHaveBeenCalled();
    expect(publisher.publishWithTransaction).not.toHaveBeenCalled();
  });

  it('creates a userId-less profile and publishes PROFILE_CREATED', async () => {
    memberProfileRepo.findByEmail.mockResolvedValue(null);
    memberProfileRepo.create.mockResolvedValue({
      id: 'prf_new',
      email: 'guest@example.com',
    } as never);

    const result = await useCase.execute({
      email: 'guest@example.com',
      firstName: 'Guest',
      lastName: 'User',
    });

    expect(memberProfileRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, email: 'guest@example.com' }),
      undefined,
    );
    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        eventType: 'workspace.profiles.profile.created',
        payload: expect.objectContaining({ profileId: 'prf_new', email: 'guest@example.com' }),
      }),
    );
    expect(result.id).toBe('prf_new');
  });
});
