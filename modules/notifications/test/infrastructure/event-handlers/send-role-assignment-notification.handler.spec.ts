import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { IdentityEvents } from '@workspace/types';
import { SendRoleAssignmentNotificationHandler } from '../../../src/infrastructure/event-handlers/send-role-assignment-notification.handler';
import { NotificationDispatchService } from '../../../src/application/services/notification-dispatch.service';

describe('SendRoleAssignmentNotificationHandler', () => {
  let dispatch: { dispatch: ReturnType<typeof jest.fn> };
  let handler: SendRoleAssignmentNotificationHandler;

  beforeEach(() => {
    dispatch = { dispatch: jest.fn() };
    handler = new SendRoleAssignmentNotificationHandler(
      dispatch as unknown as NotificationDispatchService,
    );
  });

  it('supports role assigned/revoked v2, nothing else', () => {
    expect(handler.supports(IdentityEvents.ROLE_ASSIGNED_V2)).toBe(true);
    expect(handler.supports(IdentityEvents.ROLE_REVOKED_V2)).toBe(true);
    expect(handler.supports(IdentityEvents.ROLE_ASSIGNED)).toBe(false);
    expect(handler.supports(IdentityEvents.API_KEY_CREATED)).toBe(false);
  });

  it('dispatches push + in-app for a role assignment, and email when an address is present', async () => {
    await handler.handle({
      eventType: IdentityEvents.ROLE_ASSIGNED_V2,
      payload: {
        userId: 'usr_1',
        roleId: 'rol_1',
        roleKey: 'MENTOR',
        grantedBy: 'usr_admin',
        email: 'admin@example.com',
      },
    } as never);

    expect(dispatch.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'usr_1',
        category: 'identity',
        email: expect.objectContaining({
          to: 'admin@example.com',
          template: 'role-assignment-assigned',
        }),
        push: expect.objectContaining({ title: 'Role assigned' }),
        inApp: expect.objectContaining({
          type: 'identity.role_assigned',
          title: 'Role assigned',
          body: expect.stringContaining('MENTOR'),
        }),
      }),
    );
  });

  it('dispatches push + in-app for a role revocation, and email when an address is present', async () => {
    await handler.handle({
      eventType: IdentityEvents.ROLE_REVOKED_V2,
      payload: {
        userId: 'usr_1',
        roleId: 'rol_1',
        roleKey: 'MENTOR',
        revokedBy: 'usr_admin',
        email: 'admin@example.com',
      },
    } as never);

    expect(dispatch.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'usr_1',
        email: expect.objectContaining({
          to: 'admin@example.com',
          template: 'role-assignment-revoked',
        }),
        push: expect.objectContaining({ title: 'Role revoked' }),
        inApp: expect.objectContaining({
          type: 'identity.role_revoked',
          title: 'Role revoked',
          body: expect.stringContaining('MENTOR'),
        }),
      }),
    );
  });

  it('omits email when no address is present', async () => {
    await handler.handle({
      eventType: IdentityEvents.ROLE_ASSIGNED_V2,
      payload: { userId: 'usr_1', roleId: 'rol_1', roleKey: 'MENTOR' },
    } as never);

    const call = dispatch.dispatch.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.email).toBeUndefined();
  });
});
