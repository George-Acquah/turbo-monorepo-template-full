import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import type {
  EventPublisherPort,
  HashPort,
  LoggerPort,
  TransactionPort,
  UserRepositoryPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { RegisterUseCase } from '../../../src/application/use-cases/register.use-case';
import { SessionIssuerService } from '../../../src/application/services/session-issuer.service';
import { RequestEmailVerificationUseCase } from '../../../src/application/use-cases/request-email-verification.use-case';

describe('RegisterUseCase', () => {
  let userRepo: ReturnType<typeof createMock<Pick<UserRepositoryPort, 'findByEmail' | 'create'>>>;
  let hashPort: ReturnType<typeof createMock<Pick<HashPort, 'hashPassword'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let publisher: ReturnType<
    typeof createMock<Pick<EventPublisherPort, 'publish' | 'publishWithTransaction'>>
  >;
  let logger: ReturnType<typeof createMock<Pick<LoggerPort, 'warn'>>>;
  let sessionIssuer: { issue: ReturnType<typeof jest.fn> };
  let requestEmailVerification: { execute: ReturnType<typeof jest.fn> };
  let useCase: RegisterUseCase;

  beforeEach(() => {
    userRepo = createMock<Pick<UserRepositoryPort, 'findByEmail' | 'create'>>([
      'findByEmail',
      'create',
    ]);
    hashPort = createMock<Pick<HashPort, 'hashPassword'>>(['hashPassword']);
    transactionPort = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) =>
      op(undefined)) as never);
    publisher = createMock<Pick<EventPublisherPort, 'publish' | 'publishWithTransaction'>>([
      'publish',
      'publishWithTransaction',
    ]);
    logger = createMock<Pick<LoggerPort, 'warn'>>(['warn']);
    sessionIssuer = { issue: jest.fn() };
    requestEmailVerification = { execute: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) };

    useCase = new RegisterUseCase(
      userRepo as unknown as UserRepositoryPort,
      hashPort as unknown as HashPort,
      transactionPort as unknown as TransactionPort,
      publisher as unknown as EventPublisherPort,
      logger as unknown as LoggerPort,
      sessionIssuer as unknown as SessionIssuerService,
      requestEmailVerification as unknown as RequestEmailVerificationUseCase,
    );
  });

  it('rejects registration when the email is already taken', async () => {
    userRepo.findByEmail.mockResolvedValue({ id: 'usr_existing' } as never);

    await expect(
      useCase.execute({
        email: 'taken@example.com',
        password: 'password123',
        deviceId: 'dev_1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('hashes the password, creates the user in a transaction, and issues a session', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    hashPort.hashPassword.mockResolvedValue('hashed');
    userRepo.create.mockResolvedValue({ id: 'usr_new', userType: 'MEMBER' } as never);
    sessionIssuer.issue.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    const result = await useCase.execute({
      email: 'new@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Doe',
      deviceId: 'dev_1',
    });

    expect(hashPort.hashPassword).toHaveBeenCalledWith('password123');
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.com', passwordHash: 'hashed' }),
      undefined,
    );
    expect(sessionIssuer.issue).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'usr_new', userType: 'MEMBER' }),
    );
    expect(result.accessToken).toBe('a');
    expect(requestEmailVerification.execute).toHaveBeenCalledWith({
      userId: 'usr_new',
      email: 'new@example.com',
    });
  });

  it('does not fail registration when enqueuing the verification email throws', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    hashPort.hashPassword.mockResolvedValue('hashed');
    userRepo.create.mockResolvedValue({ id: 'usr_new', userType: 'MEMBER' } as never);
    sessionIssuer.issue.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 900,
    });
    requestEmailVerification.execute.mockRejectedValue(new Error('queue unavailable'));

    const result = await useCase.execute({
      email: 'new@example.com',
      password: 'password123',
      deviceId: 'dev_1',
    });

    expect(result.accessToken).toBe('a');
    expect(logger.warn).toHaveBeenCalled();
  });
});
