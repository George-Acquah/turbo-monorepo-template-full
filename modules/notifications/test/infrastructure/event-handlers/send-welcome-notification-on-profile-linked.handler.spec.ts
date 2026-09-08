import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProfilesEvents } from '@workspace/types';
import type { BrandingRuntimeConfig } from '@workspace/ports/config';
import { SendWelcomeNotificationOnProfileLinkedHandler } from '../../../src/infrastructure/event-handlers/send-welcome-notification-on-profile-linked.handler';
import { NotificationDispatchService } from '../../../src/application/services/notification-dispatch.service';

describe('SendWelcomeNotificationOnProfileLinkedHandler', () => {
  let dispatch: { dispatch: ReturnType<typeof jest.fn> };
  let branding: BrandingRuntimeConfig;
  let handler: SendWelcomeNotificationOnProfileLinkedHandler;

  beforeEach(() => {
    dispatch = { dispatch: jest.fn() };
    branding = {
      apiUrl: 'https://api.workspace.example',
      landingUrl: 'https://workspace.example',
      portalUrl: 'https://app.workspace.example',
      landingName: 'Workspace',
      supportEmail: 'support@workspace.example',
    };

    handler = new SendWelcomeNotificationOnProfileLinkedHandler(
      dispatch as unknown as NotificationDispatchService,
      branding,
    );
  });

  it('supports only workspace.profiles.profile.linked', () => {
    expect(handler.supports(ProfilesEvents.PROFILE_LINKED)).toBe(true);
    expect(handler.supports(ProfilesEvents.PROFILE_CREATED)).toBe(false);
  });

  it('dispatches the user-welcome email and an in-app notice, keyed by userId', async () => {
    await handler.handle({
      eventType: ProfilesEvents.PROFILE_LINKED,
      payload: { profileId: 'prf_1', userId: 'usr_1', email: 'ama@example.com' },
    } as never);

    expect(dispatch.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'usr_1',
        category: 'profiles',
        email: expect.objectContaining({
          to: 'ama@example.com',
          template: 'user-welcome',
          context: expect.objectContaining({
            frontendUrl: 'https://workspace.example',
            email: 'ama@example.com',
            loginUrl: 'https://app.workspace.example/login',
            supportEmail: 'support@workspace.example',
          }),
        }),
        inApp: expect.objectContaining({ type: 'profile.linked' }),
      }),
    );
  });
});
