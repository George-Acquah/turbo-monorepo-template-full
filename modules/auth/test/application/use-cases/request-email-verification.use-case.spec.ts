import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { EmailVerificationTokenRepositoryPort, HashPort, QueueBusPort } from '@workspace/ports';
import type { BrandingRuntimeConfig } from '@workspace/ports/config';
import { QueueNames, JobNames } from '@workspace/constants';
import { createMock } from '@workspace/testing/jest';
import { RequestEmailVerificationUseCase } from '../../../src/application/use-cases/request-email-verification.use-case';

describe('RequestEmailVerificationUseCase', () => {
  let emailVerificationTokenRepo: ReturnType<
    typeof createMock<Pick<EmailVerificationTokenRepositoryPort, 'invalidateAllForUser' | 'create'>>
  >;
  let hashPort: ReturnType<
    typeof createMock<Pick<HashPort, 'generateSecureToken' | 'hashToken'>>
  >;
  let queueBus: ReturnType<typeof createMock<Pick<QueueBusPort, 'enqueue'>>>;
  let branding: BrandingRuntimeConfig;
  let useCase: RequestEmailVerificationUseCase;

  beforeEach(() => {
    emailVerificationTokenRepo = createMock<
      Pick<EmailVerificationTokenRepositoryPort, 'invalidateAllForUser' | 'create'>
    >(['invalidateAllForUser', 'create']);
    hashPort = createMock<Pick<HashPort, 'generateSecureToken' | 'hashToken'>>([
      'generateSecureToken',
      'hashToken',
    ]);
    hashPort.generateSecureToken.mockResolvedValue('raw-token');
    hashPort.hashToken.mockResolvedValue('hashed-token');
    queueBus = createMock<Pick<QueueBusPort, 'enqueue'>>(['enqueue']);
    queueBus.enqueue.mockResolvedValue('job-1');
    branding = {
      apiUrl: 'https://api.workspace.test',
      landingUrl: 'https://workspace.test',
      portalUrl: 'https://members.workspace.test/',
      landingName: 'Workspace',
      supportEmail: 'support@workspace.test',
    };

    useCase = new RequestEmailVerificationUseCase(
      emailVerificationTokenRepo as unknown as EmailVerificationTokenRepositoryPort,
      hashPort as unknown as HashPort,
      queueBus as unknown as QueueBusPort,
      branding,
    );
  });

  it('invalidates prior tokens, mints + hashes a new one, and enqueues a verification email', async () => {
    await useCase.execute({ userId: 'usr_1', email: 'member@example.com' });

    expect(emailVerificationTokenRepo.invalidateAllForUser).toHaveBeenCalledWith('usr_1');
    expect(emailVerificationTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'usr_1',
        email: 'member@example.com',
        tokenHash: 'hashed-token',
      }),
    );

    expect(queueBus.enqueue).toHaveBeenCalledWith(
      QueueNames.EMAIL_QUEUE,
      JobNames.SEND_EMAIL,
      expect.objectContaining({
        to: { email: 'member@example.com' },
        template: 'email-verification',
        context: expect.objectContaining({
          verifyUrl: 'https://members.workspace.test/verify-email/raw-token',
        }),
      }),
    );
  });

  it('never places the raw token in a field other than the one-time verifyUrl context', async () => {
    await useCase.execute({ userId: 'usr_1', email: 'member@example.com' });

    const [, , jobData] = queueBus.enqueue.mock.calls[0] as [string, string, Record<string, unknown>];
    const serialized = JSON.stringify(jobData);
    const occurrences = serialized.split('raw-token').length - 1;
    // The raw token should appear exactly once — inside verifyUrl — never duplicated
    // into a bare field that a future refactor might accidentally forward into an event.
    expect(occurrences).toBe(1);
  });
});
