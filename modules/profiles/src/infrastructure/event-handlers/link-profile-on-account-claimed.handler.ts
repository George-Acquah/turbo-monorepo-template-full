import { Inject, Injectable } from '@nestjs/common';
import {
  EVENT_PUBLISHER_TOKEN,
  LOGGER_TOKEN,
  MEMBER_PROFILE_REPOSITORY_TOKEN,
  WorkspaceEventHandlerPort,
  type EventPublisherPort,
  type LoggerPort,
  type MemberProfileRepositoryPort,
} from '@workspace/ports';
import { AggregateType } from '@workspace/constants';
import {
  AuthEvents,
  ProfilesEvents,
  type EventType,
  type StrictlyTypedWorkspaceEvent,
} from '@workspace/types';

type AccountClaimed = typeof AuthEvents.ACCOUNT_CLAIMED;

/**
 * REACTS to `workspace.auth.account.claimed`. Reads it as a fact from the
 * shared catalog — imports nothing from `modules/auth` and has no idea who
 * produced the event.
 *
 * This is the actual "guest → account claim" effect (doc 06 §5): the
 * MemberProfile created during guest checkout gets linked to the freshly
 * created (or matched) User. Auth owns the token/verification mechanics and
 * User creation; profiles owns this link, reached only via the event —
 * `modules/auth` cannot import `modules/profiles`' ports directly (the
 * context-boundary ESLint rule), so this is the only sanctioned seam.
 *
 * Also publishes `PROFILE_LINKED` right after the link succeeds — this is
 * the fact `modules/notifications` reacts to for the welcome email/in-app
 * notice (a claim doesn't publish that fact itself: `AuthEvents.ACCOUNT_CLAIMED`
 * fires the instant the User is created, whether or not the profile-link
 * step later succeeds — `PROFILE_LINKED` is the narrower, guaranteed-linked
 * signal notifications should key off).
 */
@Injectable()
export class LinkProfileOnAccountClaimedHandler extends WorkspaceEventHandlerPort<AccountClaimed> {
  private readonly context = LinkProfileOnAccountClaimedHandler.name;

  constructor(
    @Inject(MEMBER_PROFILE_REPOSITORY_TOKEN)
    private readonly memberProfileRepo: MemberProfileRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
  }

  supports(eventType: EventType): boolean {
    return eventType === AuthEvents.ACCOUNT_CLAIMED;
  }

  async handle(event: StrictlyTypedWorkspaceEvent<AccountClaimed>): Promise<void> {
    const { payload } = event;
    await this.memberProfileRepo.linkUser(payload.profileId, payload.userId);

    await this.publisher.publish({
      eventType: ProfilesEvents.PROFILE_LINKED,
      aggregateType: AggregateType.PROFILE,
      aggregateId: payload.profileId,
      userId: payload.userId,
      payload: {
        profileId: payload.profileId,
        userId: payload.userId,
        email: payload.email,
      },
    });

    this.logger.log(
      `Linked profile to claimed account [profileId=${payload.profileId}, userId=${payload.userId}]`,
      this.context,
    );
  }
}
