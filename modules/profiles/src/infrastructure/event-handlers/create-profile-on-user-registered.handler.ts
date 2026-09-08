import { Inject, Injectable } from '@nestjs/common';
import {
  AUTH_APPLICATION_TOKEN,
  LOGGER_TOKEN,
  WorkspaceEventHandlerPort,
  type AuthApplicationPort,
  type LoggerPort,
} from '@workspace/ports';
import { UserType } from '@workspace/constants';
import { AuthEvents, type EventType, type StrictlyTypedWorkspaceEvent } from '@workspace/types';
import { EnsureMemberProfileForUserUseCase } from '../../application/member-profile/use-cases/ensure-member-profile-for-user.use-case';

type UserRegistered = typeof AuthEvents.USER_REGISTERED;

/**
 * REACTS to `workspace.auth.user.registered`. Reads it as a fact from the
 * shared catalog — imports nothing from `modules/auth` beyond the sanctioned
 * `AuthApplicationPort` seam for the registrant's name.
 *
 * Closes the root gap QA found: direct self-registration
 * (`POST /v1/auth/register`) never created a `MemberProfile`, which is what
 * later made enrolment-resume and event-registration crash for anyone who
 * didn't go through guest-checkout → claim-account. Fires on registration
 * itself, not gated on email verification — nothing in the enrolment or
 * event-registration flows checks `emailVerified` today, so gating this
 * would just move the crash later instead of fixing it.
 *
 * Skips staff/admin/API-client accounts — only `MEMBER` users get a
 * `MemberProfile`.
 */
@Injectable()
export class CreateProfileOnUserRegisteredHandler extends WorkspaceEventHandlerPort<UserRegistered> {
  private readonly context = CreateProfileOnUserRegisteredHandler.name;

  constructor(
    private readonly ensureMemberProfileForUser: EnsureMemberProfileForUserUseCase,
    @Inject(AUTH_APPLICATION_TOKEN) private readonly authApp: AuthApplicationPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
  }

  supports(eventType: EventType): boolean {
    return eventType === AuthEvents.USER_REGISTERED;
  }

  async handle(event: StrictlyTypedWorkspaceEvent<UserRegistered>): Promise<void> {
    const { payload } = event;
    if (payload.userType !== UserType.MEMBER) {
      return;
    }

    const contact = await this.authApp.getUserContact(payload.userId);
    if (!contact) {
      this.logger.warn(
        `No user contact found for newly registered member [userId=${payload.userId}]`,
        this.context,
      );
      return;
    }

    await this.ensureMemberProfileForUser.execute({
      userId: payload.userId,
      email: payload.email,
      firstName: contact.firstName ?? '',
      lastName: contact.lastName ?? '',
    });

    this.logger.log(
      `Ensured member profile on registration [userId=${payload.userId}]`,
      this.context,
    );
  }
}
