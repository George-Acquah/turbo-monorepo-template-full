import { describe, it, expect, beforeEach } from '@jest/globals';
import type {
  AccountClaimTokenRepositoryPort,
  HashPort,
  LoggerPort,
  QueueBusPort,
} from '@workspace/ports';
import type { BrandingRuntimeConfig } from '@workspace/ports/config';
import { QueueNames } from '@workspace/constants';
import { createMock } from '@workspace/testing/jest';
import { IssueAccountClaimTokenUseCase } from '../../../src/application/use-cases/issue-account-claim-token.use-case';

const branding: BrandingRuntimeConfig = {
  apiUrl: 'http://localhost:3000',
  landingUrl: 'https://workspace.test',
  portalUrl: 'https://app.workspace.test',
  landingName: 'Workspace',
  supportEmail: 'support@workspace.test',
};

describe('IssueAccountClaimTokenUseCase', () => {
  let claimTokenRepo: ReturnType<typeof createMock<Pick<AccountClaimTokenRepositoryPort, 'create'>>>;
  let hashPort: ReturnType<typeof createMock<Pick<HashPort, 'generateSecureToken' | 'hashToken'>>>;
  let queueBus: ReturnType<typeof createMock<Pick<QueueBusPort, 'enqueue'>>>;
  let logger: ReturnType<typeof createMock<Pick<LoggerPort, 'error'>>>;
  let useCase: IssueAccountClaimTokenUseCase;

  beforeEach(() => {
    claimTokenRepo = createMock<Pick<AccountClaimTokenRepositoryPort, 'create'>>(['create']);
    hashPort = createMock<Pick<HashPort, 'generateSecureToken' | 'hashToken'>>([
      'generateSecureToken',
      'hashToken',
    ]);
    queueBus = createMock<Pick<QueueBusPort, 'enqueue'>>(['enqueue']);
    logger = createMock<Pick<LoggerPort, 'error'>>(['error']);
    hashPort.generateSecureToken.mockResolvedValue('raw-claim-token');
    hashPort.hashToken.mockResolvedValue('hashed-claim-token');
    claimTokenRepo.create.mockImplementation(((data: Record<string, unknown>) =>
      Promise.resolve({ ...data, status: 'PENDING' })) as never);

    useCase = new IssueAccountClaimTokenUseCase(
      claimTokenRepo as unknown as AccountClaimTokenRepositoryPort,
      hashPort as unknown as HashPort,
      queueBus as unknown as QueueBusPort,
      branding,
      logger as unknown as LoggerPort,
    );
  });

  it('mints a hashed token, persists it, and returns the raw token exactly once', async () => {
    const result = await useCase.execute({ profileId: 'prf_1', email: 'guest@example.com' });

    expect(claimTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: 'prf_1',
        email: 'guest@example.com',
        tokenHash: 'hashed-claim-token',
        expiresAt: expect.any(Date),
      }),
    );
    expect(result.rawToken).toBe('raw-claim-token');
    expect(result.token.tokenHash).toBe('hashed-claim-token');
  });

  it('enqueues an account-claim email with a portal claim URL carrying the raw token', async () => {
    await useCase.execute({
      profileId: 'prf_1',
      email: 'guest@example.com',
      programmeName: 'mentorship',
      name: 'Ama',
    });

    expect(queueBus.enqueue).toHaveBeenCalledWith(
      QueueNames.EMAIL_QUEUE,
      'send-email',
      expect.objectContaining({
        to: { email: 'guest@example.com' },
        template: 'account-claim',
        context: expect.objectContaining({
          claimUrl: 'https://app.workspace.test/claim/raw-claim-token',
          programmeName: 'mentorship',
          name: 'Ama',
        }),
      }),
    );
  });

  it('still returns the token if the email enqueue fails', async () => {
    queueBus.enqueue.mockRejectedValue(new Error('redis down'));

    const result = await useCase.execute({ profileId: 'prf_1', email: 'guest@example.com' });

    expect(result.rawToken).toBe('raw-claim-token');
    expect(logger.error).toHaveBeenCalled();
  });
});
