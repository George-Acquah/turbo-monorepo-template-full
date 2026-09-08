import { describe, it, expect, beforeEach } from '@jest/globals';
import type {
  EventPublisherPort,
  TokenBlacklistPort,
  UserSessionRepositoryPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { LogoutUseCase } from '../../../src/application/use-cases/logout.use-case';

describe('LogoutUseCase', () => {
  let sessionRepo: ReturnType<
    typeof createMock<Pick<UserSessionRepositoryPort, 'revokeSessionByJti'>>
  >;
  let blacklist: ReturnType<typeof createMock<Pick<TokenBlacklistPort, 'blacklist'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publish'>>>;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    sessionRepo = createMock<Pick<UserSessionRepositoryPort, 'revokeSessionByJti'>>([
      'revokeSessionByJti',
    ]);
    blacklist = createMock<Pick<TokenBlacklistPort, 'blacklist'>>(['blacklist']);
    publisher = createMock<Pick<EventPublisherPort, 'publish'>>(['publish']);
    useCase = new LogoutUseCase(
      sessionRepo as unknown as UserSessionRepositoryPort,
      blacklist as unknown as TokenBlacklistPort,
      publisher as unknown as EventPublisherPort,
    );
  });

  it('revokes the session and blacklists the token for its remaining lifetime', async () => {
    const exp = Math.floor(Date.now() / 1000) + 300;

    await useCase.execute({ userId: 'usr_1', jti: 'jti-1', tokenExpEpochSeconds: exp });

    expect(sessionRepo.revokeSessionByJti).toHaveBeenCalledWith('jti-1');
    expect(blacklist.blacklist).toHaveBeenCalledWith('jti-1', expect.any(Number));
    const [, ttl] = blacklist.blacklist.mock.calls[0] as [string, number];
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(300);
  });

  it('skips blacklisting when the token has no remaining lifetime', async () => {
    await useCase.execute({
      userId: 'usr_1',
      jti: 'jti-1',
      tokenExpEpochSeconds: Math.floor(Date.now() / 1000) - 10,
    });

    expect(sessionRepo.revokeSessionByJti).toHaveBeenCalledWith('jti-1');
    expect(blacklist.blacklist).not.toHaveBeenCalled();
  });
});
