import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { UserRepositoryPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { LoginUseCase } from '../../../src/application/use-cases/login.use-case';
import { SessionIssuerService } from '../../../src/application/services/session-issuer.service';

describe('LoginUseCase', () => {
  let userRepo: ReturnType<typeof createMock<Pick<UserRepositoryPort, 'resetFailedLogins'>>>;
  let sessionIssuer: { issue: ReturnType<typeof jest.fn> };
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepo = createMock<Pick<UserRepositoryPort, 'resetFailedLogins'>>(['resetFailedLogins']);
    sessionIssuer = { issue: jest.fn() };
    useCase = new LoginUseCase(
      userRepo as unknown as UserRepositoryPort,
      sessionIssuer as unknown as SessionIssuerService,
    );
  });

  it('resets failed logins then issues a session for the user', async () => {
    userRepo.resetFailedLogins.mockResolvedValue({
      id: 'usr_1',
      userType: 'MEMBER',
    } as never);
    sessionIssuer.issue.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    const result = await useCase.execute({
      userId: 'usr_1',
      deviceId: 'dev_1',
      ipAddress: '1.2.3.4',
      userAgent: 'jest',
    });

    expect(userRepo.resetFailedLogins).toHaveBeenCalledWith('usr_1', '1.2.3.4', expect.any(Date));
    expect(sessionIssuer.issue).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'usr_1', userType: 'MEMBER', deviceId: 'dev_1' }),
    );
    expect(result.accessToken).toBe('a');
  });
});
