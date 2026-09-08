import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceEventHandlerPort } from '@workspace/ports';
import { BRANDING_RUNTIME_CONFIG_TOKEN, type BrandingRuntimeConfig } from '@workspace/ports/config';
import {
  ProfilesEvents,
  type EventType,
  type StrictlyTypedWorkspaceEvent,
} from '@workspace/types';
import { NotificationDispatchService } from '../../application/services/notification-dispatch.service';

type ProfileLinked = typeof ProfilesEvents.PROFILE_LINKED;

/**
 * REACTS to `workspace.profiles.profile.linked`. Reads it as a fact from
 * the shared catalog — imports nothing from `modules/profiles`.
 *
 * Fires once, right when a guest finishes claiming their account (doc 06
 * §5) — the real `'user-welcome'` email template (already exists;
 * `tempPassword` stays omitted, it's for an admin-assigned temp password,
 * not a self-chosen claim password) plus a userId-keyed in-app notice.
 * userId-keyed (not profileId) since `ProfileLinkedPayload` always carries
 * both, and userId is what the in-app store/SSE push key on.
 */
@Injectable()
export class SendWelcomeNotificationOnProfileLinkedHandler extends WorkspaceEventHandlerPort<ProfileLinked> {
  constructor(
    private readonly dispatch: NotificationDispatchService,
    @Inject(BRANDING_RUNTIME_CONFIG_TOKEN) private readonly branding: BrandingRuntimeConfig,
  ) {
    super();
  }

  supports(eventType: EventType): boolean {
    return eventType === ProfilesEvents.PROFILE_LINKED;
  }

  async handle(event: StrictlyTypedWorkspaceEvent<ProfileLinked>): Promise<void> {
    const { payload } = event;
    const loginUrl = `${this.branding.portalUrl.replace(/\/+$/, '')}/login`;

    await this.dispatch.dispatch({
      userId: payload.userId,
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
        type: 'profile.linked',
        title: 'Welcome to Workspace',
        body: 'Your account is set up and ready to go.',
      },
    });
  }
}
