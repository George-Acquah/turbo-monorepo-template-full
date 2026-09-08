import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthEvents } from '@workspace/types';
import type { EventPublisherPort, LoggerPort, MemberProfileRepositoryPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { LinkProfileOnAccountClaimedHandler } from '../../../src/infrastructure/event-handlers/link-profile-on-account-claimed.handler';

describe('LinkProfileOnAccountClaimedHandler', () => {
  let memberProfileRepo: ReturnType<typeof createMock<Pick<MemberProfileRepositoryPort, 'linkUser'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publish'>>>;
  let logger: { log: ReturnType<typeof jest.fn> };
  let handler: LinkProfileOnAccountClaimedHandler;

  beforeEach(() => {
    memberProfileRepo = createMock<Pick<MemberProfileRepositoryPort, 'linkUser'>>(['linkUser']);
    publisher = createMock<Pick<EventPublisherPort, 'publish'>>(['publish']);
    logger = { log: jest.fn() };

    handler = new LinkProfileOnAccountClaimedHandler(
      memberProfileRepo as unknown as MemberProfileRepositoryPort,
      publisher as unknown as EventPublisherPort,
      logger as unknown as LoggerPort,
    );
  });

  it('supports only workspace.auth.account.claimed', () => {
    expect(handler.supports(AuthEvents.ACCOUNT_CLAIMED)).toBe(true);
    expect(handler.supports(AuthEvents.USER_REGISTERED)).toBe(false);
  });

  it('links the profile to the claimed userId and publishes PROFILE_LINKED', async () => {
    await handler.handle({
      eventType: AuthEvents.ACCOUNT_CLAIMED,
      aggregateId: 'usr_1',
      payload: { userId: 'usr_1', profileId: 'prf_1', email: 'a@b.com' },
    } as never);

    expect(memberProfileRepo.linkUser).toHaveBeenCalledWith('prf_1', 'usr_1');
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'workspace.profiles.profile.linked',
        payload: { profileId: 'prf_1', userId: 'usr_1', email: 'a@b.com' },
      }),
    );
  });
});
