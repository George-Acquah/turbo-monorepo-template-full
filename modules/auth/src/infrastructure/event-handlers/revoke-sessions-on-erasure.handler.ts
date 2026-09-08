import { Inject, Injectable } from '@nestjs/common';
import {
  LOGGER_TOKEN,
  WorkspaceEventHandlerPort,
  USER_SESSION_REPOSITORY_TOKEN,
  type LoggerPort,
  type UserSessionRepositoryPort,
} from '@workspace/ports';
import { ProfilesEvents, type EventType, type StrictlyTypedWorkspaceEvent } from '@workspace/types';

type ErasureRequested = typeof ProfilesEvents.ERASURE_REQUESTED;

/**
 * REACTS to `workspace.profiles.erasure.requested`.
 *
 * Auth owns the User's credentials and sessions, so when a data-erasure is
 * requested it revokes every session for that user — a real GDPR-adjacent
 * side effect. It reads the event as a *fact* from the shared catalog
 * (@workspace/types); it imports nothing from the profiles module and has no
 * idea who produced the event. Producer-agnostic by construction.
 */
@Injectable()
export class RevokeSessionsOnErasureHandler extends WorkspaceEventHandlerPort<ErasureRequested> {
  private readonly context = RevokeSessionsOnErasureHandler.name;

  constructor(
    @Inject(USER_SESSION_REPOSITORY_TOKEN)
    private readonly sessions: UserSessionRepositoryPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
  }

  supports(eventType: EventType): boolean {
    return eventType === ProfilesEvents.ERASURE_REQUESTED;
  }

  async handle(event: StrictlyTypedWorkspaceEvent<ErasureRequested>): Promise<void> {
    const { payload } = event;
    // A profile can exist before a user is ever claimed (guest checkout). If
    // there's no userId, there are no auth sessions to revoke — nothing to do.
    if (!payload.userId) return;

    await this.sessions.revokeAllForUser(payload.userId);
    this.logger.log(
      `Revoked all sessions for erased user [aggregateId=${event.aggregateId}]`,
      this.context,
    );
  }
}
