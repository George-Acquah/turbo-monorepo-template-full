import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PushTemplate } from '@workspace/types';
import { NotificationDispatchService } from '../../../src/application/services/notification-dispatch.service';

describe('NotificationDispatchService', () => {
  let notifications: { create: ReturnType<typeof jest.fn> };
  let deliveries: { create: ReturnType<typeof jest.fn> };
  let preferences: { findPreference: ReturnType<typeof jest.fn> };
  let overrides: { findActiveOverrides: ReturnType<typeof jest.fn> };
  let pushDevices: { listActiveUserDevices: ReturnType<typeof jest.fn> };
  let inAppNotifications: { create: ReturnType<typeof jest.fn> };
  let emailDelivery: { send: ReturnType<typeof jest.fn> };
  let smsDelivery: { send: ReturnType<typeof jest.fn> };
  let pushDelivery: { send: ReturnType<typeof jest.fn> };
  let whatsAppDelivery: { send: ReturnType<typeof jest.fn> };
  let redis: { publish: ReturnType<typeof jest.fn> };
  let logger: {
    debug: ReturnType<typeof jest.fn>;
    log: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  let service: NotificationDispatchService;

  beforeEach(() => {
    notifications = { create: jest.fn().mockResolvedValue({ id: 'notif_1' }) };
    deliveries = { create: jest.fn().mockResolvedValue({ id: 'delivery_1' }) };
    preferences = { findPreference: jest.fn().mockResolvedValue(null) };
    overrides = { findActiveOverrides: jest.fn().mockResolvedValue([]) };
    pushDevices = { listActiveUserDevices: jest.fn().mockResolvedValue([]) };
    inAppNotifications = { create: jest.fn().mockResolvedValue({ id: 'inapp_1' }) };
    emailDelivery = { send: jest.fn().mockResolvedValue('email-msg-1') };
    smsDelivery = { send: jest.fn().mockResolvedValue('sms-msg-1') };
    pushDelivery = { send: jest.fn().mockResolvedValue('push-msg-1') };
    whatsAppDelivery = { send: jest.fn().mockResolvedValue('wa-msg-1') };
    redis = { publish: jest.fn().mockResolvedValue(undefined) };
    logger = { debug: jest.fn(), log: jest.fn(), warn: jest.fn(), error: jest.fn() };

    service = new NotificationDispatchService(
      notifications as never,
      deliveries as never,
      preferences as never,
      overrides as never,
      pushDevices as never,
      inAppNotifications as never,
      emailDelivery as never,
      smsDelivery as never,
      pushDelivery as never,
      whatsAppDelivery as never,
      redis as never,
      logger as never,
    );
  });

  it('always sends email, regardless of userId', async () => {
    await service.dispatch({
      profileId: 'prof_1',
      category: 'billing',
      eventType: 'workspace.billing.payment.succeeded',
      email: {
        to: 'a@b.com',
        subject: 'Receipt',
        template: 'payment-receipt',
        context: {},
      },
    });

    expect(emailDelivery.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: { email: 'a@b.com' } }),
    );
  });

  it('skips sms when no userId is present (guest/unclaimed profile)', async () => {
    await service.dispatch({
      profileId: 'prof_1',
      category: 'billing',
      eventType: 'workspace.billing.payment.succeeded',
      sms: { to: '+233244000000', template: 'payment-receipt', context: {} },
    });

    expect(smsDelivery.send).not.toHaveBeenCalled();
  });

  it('skips sms when the recipient has disabled the preference', async () => {
    preferences.findPreference.mockResolvedValue({ enabled: false });

    await service.dispatch({
      profileId: 'prof_1',
      userId: 'usr_1',
      category: 'billing',
      eventType: 'workspace.billing.payment.succeeded',
      sms: { to: '+233244000000', template: 'payment-receipt', context: {} },
    });

    expect(smsDelivery.send).not.toHaveBeenCalled();
  });

  it('sends sms when a compliance override forces delivery, even if the preference is disabled', async () => {
    preferences.findPreference.mockResolvedValue({ enabled: false });
    overrides.findActiveOverrides.mockResolvedValue([{ forceDelivery: true }]);

    await service.dispatch({
      profileId: 'prof_1',
      userId: 'usr_1',
      category: 'billing',
      eventType: 'workspace.billing.payment.succeeded',
      sms: { to: '+233244000000', template: 'payment-receipt', context: {} },
    });

    expect(smsDelivery.send).toHaveBeenCalled();
  });

  it('fans push out to every active device for the user', async () => {
    pushDevices.listActiveUserDevices.mockResolvedValue([
      { deviceToken: 'tok_1' },
      { deviceToken: 'tok_2' },
    ]);

    await service.dispatch({
      profileId: 'prof_1',
      userId: 'usr_1',
      category: 'billing',
      eventType: 'workspace.billing.payment.succeeded',
      push: { title: 'Paid', body: 'Received', template: PushTemplate.PAYMENT_RECEIPT, context: {} },
    });

    expect(pushDelivery.send).toHaveBeenCalledTimes(2);
    expect(pushDelivery.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'tok_1' }));
    expect(pushDelivery.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'tok_2' }));
  });

  it('always writes an in-app notification when profileId is present, even without userId', async () => {
    await service.dispatch({
      profileId: 'prof_1',
      category: 'billing',
      eventType: 'workspace.billing.payment.succeeded',
      inApp: { type: 'payment.receipt', title: 'Paid', body: 'Your payment succeeded' },
    });

    expect(inAppNotifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: 'prof_1', type: 'payment.receipt', title: 'Paid' }),
    );
    expect(redis.publish).not.toHaveBeenCalled();
  });

  it('fires a live SSE push for in-app notifications when userId is known', async () => {
    await service.dispatch({
      profileId: 'prof_1',
      userId: 'usr_1',
      category: 'billing',
      eventType: 'workspace.billing.payment.succeeded',
      inApp: { type: 'payment.receipt', title: 'Paid', body: 'Your payment succeeded' },
    });

    expect(redis.publish).toHaveBeenCalledWith(
      'realtime:user:usr_1',
      expect.objectContaining({ payload: expect.objectContaining({ title: 'Paid' }) }),
    );
  });

  it('gates in-app notifications by preference only when userId is known', async () => {
    preferences.findPreference.mockResolvedValue({ enabled: false });

    await service.dispatch({
      profileId: 'prof_1',
      userId: 'usr_1',
      category: 'billing',
      eventType: 'workspace.billing.payment.succeeded',
      inApp: { type: 'payment.receipt', title: 'Paid', body: 'Your payment succeeded' },
    });

    expect(inAppNotifications.create).not.toHaveBeenCalled();
  });

  it('writes a userId-only in-app notification for a recipient with no MemberProfile (staff/admin)', async () => {
    await service.dispatch({
      userId: 'usr_staff',
      category: 'identity',
      eventType: 'workspace.identity.role.assigned',
      inApp: { type: 'identity.role_assigned', title: 'Role assigned', body: 'You got MENTOR' },
    });

    expect(inAppNotifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: undefined, userId: 'usr_staff', type: 'identity.role_assigned' }),
    );
    expect(redis.publish).toHaveBeenCalledWith(
      'realtime:user:usr_staff',
      expect.objectContaining({ payload: expect.objectContaining({ title: 'Role assigned' }) }),
    );
  });

  it('does not throw and skips the in-app write when neither profileId nor userId is present', async () => {
    await expect(
      service.dispatch({
        category: 'identity',
        eventType: 'workspace.identity.role.assigned',
        inApp: { type: 'identity.role_assigned', title: 'Role assigned', body: 'You got MENTOR' },
      }),
    ).resolves.toBeUndefined();

    expect(inAppNotifications.create).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
