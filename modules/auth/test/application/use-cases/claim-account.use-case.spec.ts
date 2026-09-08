import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import type {
  AccountClaimTokenRepositoryPort,
  EventPublisherPort,
  HashPort,
  TransactionPort,
  UserRepositoryPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { ClaimAccountUseCase } from '../../../src/application/use-cases/claim-account.use-case';
import { SessionIssuerService } from '../../../src/application/services/session-issuer.service';

describe('ClaimAccountUseCase', () => {
  let claimTokenRepo: ReturnType<
    typeof createMock<Pick<AccountClaimTokenRepositoryPort, 'findByToken' | 'markClaimed'>>
  >;
  let userRepo: ReturnType<typeof createMock<Pick<UserRepositoryPort, 'findByEmail' | 'create'>>>;
  let hashPort: ReturnType<typeof createMock<Pick<HashPort, 'hashToken' | 'hashPassword'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let sessionIssuer: { issue: ReturnType<typeof jest.fn> };
  let useCase: ClaimAccountUseCase;

  beforeEach(() => {
    claimTokenRepo = createMock<
      Pick<AccountClaimTokenRepositoryPort, 'findByToken' | 'markClaimed'>
    >(['findByToken', 'markClaimed']);
    userRepo = createMock<Pick<UserRepositoryPort, 'findByEmail' | 'create'>>([
      'findByEmail',
      'create',
    ]);
    hashPort = createMock<Pick<HashPort, 'hashToken' | 'hashPassword'>>([
      'hashToken',
      'hashPassword',
    ]);
    hashPort.hashToken.mockResolvedValue('hashed-token');
    publisher = createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>([
      'publishWithTransaction',
    ]);
    transactionPort = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) =>
      op(undefined)) as never);
    sessionIssuer = { issue: jest.fn() };

    useCase = new ClaimAccountUseCase(
      claimTokenRepo as unknown as AccountClaimTokenRepositoryPort,
      userRepo as unknown as UserRepositoryPort,
      hashPort as unknown as HashPort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
      sessionIssuer as unknown as SessionIssuerService,
    );
  });

  it('rejects an unknown claim token', async () => {
    claimTokenRepo.findByToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ claimToken: 'bad', password: 'password123', deviceId: 'dev_1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a token that has already been claimed/cancelled', async () => {
    claimTokenRepo.findByToken.mockResolvedValue({
      id: 'act_1',
      status: 'ACCEPTED',
      expiresAt: new Date(Date.now() + 10_000),
      profileId: 'prf_1',
      email: 'guest@example.com',
    } as never);

    await expect(
      useCase.execute({ claimToken: 'used', password: 'password123', deviceId: 'dev_1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an expired token', async () => {
    claimTokenRepo.findByToken.mockResolvedValue({
      id: 'act_1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 10_000),
      profileId: 'prf_1',
      email: 'guest@example.com',
    } as never);

    await expect(
      useCase.execute({ claimToken: 'expired', password: 'password123', deviceId: 'dev_1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a new User, marks the token claimed, emits ACCOUNT_CLAIMED, and issues a session', async () => {
    claimTokenRepo.findByToken.mockResolvedValue({
      id: 'act_1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 10_000),
      profileId: 'prf_1',
      email: 'guest@example.com',
    } as never);
    userRepo.findByEmail.mockResolvedValue(null);
    hashPort.hashPassword.mockResolvedValue('hashed-password');
    userRepo.create.mockResolvedValue({ id: 'usr_new' } as never);
    sessionIssuer.issue.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    const result = await useCase.execute({
      claimToken: 'raw-token',
      password: 'password123',
      deviceId: 'dev_1',
    });

    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'guest@example.com', passwordHash: 'hashed-password' }),
      undefined,
    );
    expect(claimTokenRepo.markClaimed).toHaveBeenCalledWith('act_1', 'usr_new', undefined);
    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        eventType: 'workspace.auth.account.claimed',
        payload: { userId: 'usr_new', profileId: 'prf_1', email: 'guest@example.com' },
      }),
    );
    expect(sessionIssuer.issue).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'usr_new', userType: 'MEMBER' }),
    );
    expect(result.accessToken).toBe('a');
  });

  it('links to an existing verified User instead of creating a duplicate account', async () => {
    claimTokenRepo.findByToken.mockResolvedValue({
      id: 'act_1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 10_000),
      profileId: 'prf_1',
      email: 'existing@example.com',
    } as never);
    userRepo.findByEmail.mockResolvedValue({
      id: 'usr_existing',
      userType: 'MEMBER',
      emailVerified: true,
    } as never);
    sessionIssuer.issue.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    await useCase.execute({ claimToken: 'raw-token', password: 'password123', deviceId: 'dev_1' });

    expect(userRepo.create).not.toHaveBeenCalled();
    expect(claimTokenRepo.markClaimed).toHaveBeenCalledWith('act_1', 'usr_existing', undefined);
  });
});
