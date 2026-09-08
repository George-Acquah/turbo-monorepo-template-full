import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceEventHandlerPort } from '@workspace/ports';
import { BRANDING_RUNTIME_CONFIG_TOKEN, type BrandingRuntimeConfig } from '@workspace/ports/config';
import { UserType } from '@workspace/constants';
import { AuthEvents, type EventType, type StrictlyTypedWorkspaceEvent } from '@workspace/types';
import { NotificationDispatchService } from '../../application/services/notification-dispatch.service';

type UserRegistered = typeof AuthEvents.USER_REGISTERED;

/**
 * REACTS to `workspace.auth.user.registered`. Reads it as a fact from the
 * shared catalog — imports nothing from `modules/auth`.
 *
 * Builds the direct-registration welcome path this codebase's own comments
 * previously flagged as "intentionally NOT built yet" (see this directory's
 * `providers.ts` history) — direct self-registration now creates a
 * `MemberProfile` too (`modules/profiles`' `CreateProfileOnUserRegisteredHandler`
 * reacts to the same event), so the same `'user-welcome'` template used on the
 * guest → account-claim path (`SendWelcomeNotificationOnProfileLinkedHandler`)
 * applies here as well. Skips staff/admin/API-client accounts — they never
 * see a member-facing welcome touch.
 */
@Injectable()
export class SendWelcomeNotificationOnUserRegisteredHandler extends WorkspaceEventHandlerPort<UserRegistered> {
  constructor(
    private readonly dispatch: NotificationDispatchService,
    @Inject(BRANDING_RUNTIME_CONFIG_TOKEN) private readonly branding: BrandingRuntimeConfig,
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

    const loginUrl = `${this.branding.portalUrl.replace(/\/+$/, '')}/login`;

    await this.dispatch.dispatch({
      userId: payload.userId,
      // Same catalogue slot as the account-claim welcome handler
      // (`SendWelcomeNotificationOnProfileLinkedHandler`) — both are the same
      // "welcome"/onboarding touch, just different trigger paths, so they
      // share one togglable preference category.
      category: 'profiles',
      eventType: event.eventType,
      email: {
        to: payload.email,
        subject: 'Welcome to Workspace',
        template: 'user-welcome',
        context: {
          frontendUrl: this.branding.landingUrl,
          email: payload.email,
          loginUrl,
          supportEmail: this.branding.supportEmail,
          year: new Date().getFullYear(),
        },
      },
      inApp: {
        type: 'user.registered',
        title: 'Welcome to Workspace',
        body: 'Your account is set up and ready to go.',
      },
    });
  }
}
