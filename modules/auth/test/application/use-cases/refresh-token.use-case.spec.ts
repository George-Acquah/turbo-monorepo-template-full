import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import type {
  EventPublisherPort,
  UserRepositoryPort,
  UserSessionRepositoryPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { RefreshTokenUseCase } from '../../../src/application/use-cases/refresh-token.use-case';
import { SessionIssuerService } from '../../../src/application/services/session-issuer.service';

describe('RefreshTokenUseCase', () => {
  let userRepo: ReturnType<typeof createMock<Pick<UserRepositoryPort, 'findById'>>>;
  let sessionRepo: ReturnType<
    typeof createMock<Pick<UserSessionRepositoryPort, 'revokeSessionByJti'>>
  >;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publish'>>>;
  let sessionIssuer: { issue: ReturnType<typeof jest.fn> };
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    userRepo = createMock<Pick<UserRepositoryPort, 'findById'>>(['findById']);
    sessionRepo = createMock<Pick<UserSessionRepositoryPort, 'revokeSessionByJti'>>([
      'revokeSessionByJti',
    ]);
    publisher = createMock<Pick<EventPublisherPort, 'publish'>>(['publish']);
    sessionIssuer = { issue: jest.fn() };
    useCase = new RefreshTokenUseCase(
      userRepo as unknown as UserRepositoryPort,
      sessionRepo as unknown as UserSessionRepositoryPort,
      publisher as unknown as EventPublisherPort,
      sessionIssuer as unknown as SessionIssuerService,
    );
  });

  it('revokes the old session and issues a fresh pair with the user current userType', async () => {
    userRepo.findById.mockResolvedValue({
      id: 'usr_1',
      userType: 'MEMBER',
      status: 'ACTIVE',
      deletedAt: null,
    } as never);
    sessionIssuer.issue.mockResolvedValue({
      accessToken: 'a2',
      refreshToken: 'r2',
      tokenType: 'Bearer',
      expiresIn: 900,
    });

    const result = await useCase.execute({ userId: 'usr_1', jti: 'old-jti', deviceId: 'dev_1' });

    expect(sessionRepo.revokeSessionByJti).toHaveBeenCalledWith('old-jti', undefined, 'usr_1');
    expect(sessionIssuer.issue).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'usr_1', userType: 'MEMBER', deviceId: 'dev_1' }),
    );
    expect(result.accessToken).toBe('a2');
  });

  it('rejects when the user is no longer active', async () => {
    userRepo.findById.mockResolvedValue({
      id: 'usr_1',
      userType: 'MEMBER',
      status: 'SUSPENDED',
      deletedAt: null,
    } as never);

    await expect(
      useCase.execute({ userId: 'usr_1', jti: 'old-jti', deviceId: 'dev_1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessionRepo.revokeSessionByJti).not.toHaveBeenCalled();
  });
});
