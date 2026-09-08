import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type {
  CachePort,
  EmailVerificationTokenRepositoryPort,
  EventPublisherPort,
  HashPort,
  TransactionPort,
  UserRepositoryPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { VerifyEmailUseCase } from '../../../src/application/use-cases/verify-email.use-case';

describe('VerifyEmailUseCase', () => {
  let emailVerificationTokenRepo: ReturnType<
    typeof createMock<
      Pick<EmailVerificationTokenRepositoryPort, 'findByTokenHash' | 'markAsUsed'>
    >
  >;
  let userRepo: ReturnType<typeof createMock<Pick<UserRepositoryPort, 'updateSecurity'>>>;
  let hashPort: ReturnType<typeof createMock<Pick<HashPort, 'hashToken'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let cache: ReturnType<typeof createMock<Pick<CachePort, 'deleteEntity'>>>;
  let useCase: VerifyEmailUseCase;

  beforeEach(() => {
    emailVerificationTokenRepo = createMock<
      Pick<EmailVerificationTokenRepositoryPort, 'findByTokenHash' | 'markAsUsed'>
    >(['findByTokenHash', 'markAsUsed']);
    userRepo = createMock<Pick<UserRepositoryPort, 'updateSecurity'>>(['updateSecurity']);
    hashPort = createMock<Pick<HashPort, 'hashToken'>>(['hashToken']);
    hashPort.hashToken.mockResolvedValue('hashed-token');
    publisher = createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>([
      'publishWithTransaction',
    ]);
    transactionPort = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) =>
      op(undefined)) as never);
    cache = createMock<Pick<CachePort, 'deleteEntity'>>(['deleteEntity']);

    useCase = new VerifyEmailUseCase(
      emailVerificationTokenRepo as unknown as EmailVerificationTokenRepositoryPort,
      userRepo as unknown as UserRepositoryPort,
      hashPort as unknown as HashPort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
      cache as unknown as CachePort,
    );
  });

  it('rejects an unknown token', async () => {
    emailVerificationTokenRepo.findByTokenHash.mockResolvedValue(null);

    await expect(useCase.execute({ rawToken: 'bad' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an already-used token', async () => {
    emailVerificationTokenRepo.findByTokenHash.mockResolvedValue({
      id: 'emv_1',
      userId: 'usr_1',
      email: 'member@example.com',
      expiresAt: new Date(Date.now() + 10_000),
      usedAt: new Date(),
    } as never);

    await expect(useCase.execute({ rawToken: 'used' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an expired token', async () => {
    emailVerificationTokenRepo.findByTokenHash.mockResolvedValue({
      id: 'emv_1',
      userId: 'usr_1',
      email: 'member@example.com',
      expiresAt: new Date(Date.now() - 10_000),
      usedAt: null,
    } as never);

    await expect(useCase.execute({ rawToken: 'expired' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('marks the token used, flips emailVerified, emits a token-free EMAIL_VERIFIED fact, and evicts the /me cache', async () => {
    emailVerificationTokenRepo.findByTokenHash.mockResolvedValue({
      id: 'emv_1',
      userId: 'usr_1',
      email: 'member@example.com',
      expiresAt: new Date(Date.now() + 10_000),
      usedAt: null,
    } as never);

    const result = await useCase.execute({ rawToken: 'raw-token' });

    expect(hashPort.hashToken).toHaveBeenCalledWith('raw-token');
    expect(emailVerificationTokenRepo.markAsUsed).toHaveBeenCalledWith('emv_1', undefined);
    expect(userRepo.updateSecurity).toHaveBeenCalledWith(
      'usr_1',
      expect.objectContaining({ emailVerified: true }),
      undefined,
    );

    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        eventType: 'workspace.auth.email.verified',
        payload: { userId: 'usr_1', email: 'member@example.com' },
      }),
    );
    // The security-critical assertion: the raw token must never appear in the
    // published event payload (modules/audit copies payloads verbatim into
    // AuditLog.newValues — a permanently-retained, staff-readable table).
    const publishedEvent = publisher.publishWithTransaction.mock.calls[0]?.[1] as {
      payload: Record<string, unknown>;
    };
    expect(JSON.stringify(publishedEvent.payload)).not.toContain('raw-token');

    expect(cache.deleteEntity).toHaveBeenCalledWith('identity:user', 'usr_1');
    expect(result).toEqual({ email: 'member@example.com' });
  });
});
