import { Inject, Injectable } from '@nestjs/common';
import {
  COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN,
  EMAIL_DELIVERY_PORT,
  IN_APP_NOTIFICATION_STORE_TOKEN,
  LOGGER_TOKEN,
  NOTIFICATION_DELIVERY_STORE_TOKEN,
  NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN,
  NOTIFICATION_STORE_TOKEN,
  PUSH_DELIVERY_PORT,
  PUSH_DEVICE_REPOSITORY_TOKEN,
  REDIS_PORT_TOKEN,
  SMS_DELIVERY_PORT,
  WHATSAPP_DELIVERY_PORT,
  type CommunicationPreferenceOverrideRepositoryPort,
  type EmailDeliveryPort,
  type InAppNotificationStorePort,
  type LoggerPort,
  type NotificationDeliveryStorePort,
  type NotificationPreferenceRepositoryPort,
  type NotificationStorePort,
  type PushDeliveryPort,
  type PushDeviceRepositoryPort,
  type RedisPort,
  type SmsDeliveryPort,
  type WhatsAppDeliveryPort,
} from '@workspace/ports';
import {
  AggregateType,
  EmailCategory,
  EmailTemplate,
  NotificationChannel,
  NotificationPriority,
  NotificationProvider,
  NotificationProviderChannel,
  SmsTemplate,
  WhatsAppTemplate,
} from '@workspace/constants';
import type { PushTemplate } from '@workspace/types';

interface ChannelRequest<TTemplate> {
  template: TTemplate;
  context: Record<string, unknown>;
}

export interface InAppNotificationRequest {
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface DispatchInput {
  /** Optional because staff/admin recipients (identity's RBAC events) have
   * no MemberProfile at all — userId carries those instead. At least one of
   * profileId/userId must be set; dispatchInApp throws if neither is. */
  profileId?: string;
  /** SMS/Push/WhatsApp are only attempted when userId is known — preference
   * and device-token lookups are userId-keyed (see providers.ts doc comment
   * on the identity gap). Guest/unclaimed-profile recipients only ever get
   * email. In-app is the exception — it's profileId-or-userId-keyed and
   * guest-safe. */
  userId?: string;
  category: string;
  eventType: string;
  email?: ChannelRequest<EmailTemplate> & {
    to: string;
    subject: string;
    /**
     * Which email provider category (see EMAIL_*_PROVIDER routing) this send
     * should route through. Without this, EmailProviderRouter falls back to
     * EMAIL_TEMPLATE_CATEGORY_MAP's template-name lookup — correct today only
     * by coincidence, since NotificationCategory and EmailCategory are
     * deliberately separate enums (see email-category.constants.ts's own doc
     * comment). Pass NOTIFICATION_TO_EMAIL_CATEGORY[input.category] explicitly
     * rather than relying on that fallback.
     */
    category?: EmailCategory;
  };
  sms?: ChannelRequest<SmsTemplate> & { to: string };
  push?: ChannelRequest<PushTemplate> & { title: string; body: string };
  whatsapp?: ChannelRequest<WhatsAppTemplate> & { to: string };
  inApp?: InAppNotificationRequest;
}

/**
 * Fans one logical notification out across whichever channels the input
 * carries. Email is unconditional (payload-carried, no preference lookup —
 * matches transactional-email precedent). SMS/Push/WhatsApp are gated by
 * CommunicationPreferenceOverride (category-wide forced delivery — compliance/
 * security/financial) then NotificationPreference (per-user opt-out); a
 * disabled preference silently skips that channel, it's not an error.
 */
@Injectable()
export class NotificationDispatchService {
  private readonly context = NotificationDispatchService.name;

  constructor(
    @Inject(NOTIFICATION_STORE_TOKEN) private readonly notifications: NotificationStorePort,
    @Inject(NOTIFICATION_DELIVERY_STORE_TOKEN)
    private readonly deliveries: NotificationDeliveryStorePort,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY_TOKEN)
    private readonly preferences: NotificationPreferenceRepositoryPort,
    @Inject(COMMUNICATION_PREFERENCE_OVERRIDE_REPOSITORY_TOKEN)
    private readonly overrides: CommunicationPreferenceOverrideRepositoryPort,
    @Inject(PUSH_DEVICE_REPOSITORY_TOKEN) private readonly pushDevices: PushDeviceRepositoryPort,
    @Inject(IN_APP_NOTIFICATION_STORE_TOKEN)
    private readonly inAppNotifications: InAppNotificationStorePort,
    @Inject(EMAIL_DELIVERY_PORT) private readonly emailDelivery: EmailDeliveryPort,
    @Inject(SMS_DELIVERY_PORT) private readonly smsDelivery: SmsDeliveryPort,
    @Inject(PUSH_DELIVERY_PORT) private readonly pushDelivery: PushDeliveryPort,
    @Inject(WHATSAPP_DELIVERY_PORT) private readonly whatsAppDelivery: WhatsAppDeliveryPort,
    @Inject(REDIS_PORT_TOKEN) private readonly redis: RedisPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {}

  /**
   * Each channel is isolated: one channel's transport failure (e.g. SMTP auth
   * rejected) must not prevent the others from being attempted, and must not
   * throw out of `dispatch()` — a thrown error here would fail the whole
   * BullMQ job and cause the *entire* dispatch (every channel, including ones
   * that already succeeded) to re-run on retry. Failures are logged per
   * channel instead. Confirmed live: before this fix, a real SMTP auth
   * failure aborted SMS/in-app entirely and caused 3 duplicate Notification
   * records from BullMQ's default retries re-running the whole method.
   */
  async dispatch(input: DispatchInput): Promise<void> {
    if (input.email) {
      await this.isolate('email', async () => {
        const { notificationId, deliveryId } = await this.createRecord(
          input,
          NotificationChannel.EMAIL,
          input.email!.subject,
          input.email!.context,
        );
        await this.emailDelivery.send({
          deliveryId,
          notificationId,
          to: { email: input.email!.to },
          subject: input.email!.subject,
          template: input.email!.template,
          context: input.email!.context,
          category: input.email!.category,
        });
      });
    }

    if (input.inApp) {
      await this.isolate('in-app', () => this.dispatchInApp(input, input.inApp!));
    }

    const canReachUser = Boolean(input.userId);

    if (input.sms && canReachUser) {
      await this.isolate('sms', () =>
        this.dispatchGated(input, NotificationChannel.SMS, input.sms!.template, async () => {
          const { notificationId, deliveryId } = await this.createRecord(
            input,
            NotificationChannel.SMS,
            undefined,
            input.sms!.context,
          );
          await this.smsDelivery.send({
            deliveryId,
            notificationId,
            to: input.sms!.to,
            template: input.sms!.template,
            context: input.sms!.context,
          });
        }),
      );
    }

    if (input.whatsapp && canReachUser) {
      await this.isolate('whatsapp', () =>
        this.dispatchGated(
          input,
          NotificationChannel.WHATSAPP,
          input.whatsapp!.template,
          async () => {
            const { notificationId, deliveryId } = await this.createRecord(
              input,
              NotificationChannel.WHATSAPP,
              undefined,
              input.whatsapp!.context,
            );
            await this.whatsAppDelivery.send({
              deliveryId,
              notificationId,
              to: input.whatsapp!.to,
              template: input.whatsapp!.template,
              context: input.whatsapp!.context,
            });
          },
        ),
      );
    }

    if (input.push && canReachUser) {
      await this.isolate('push', () =>
        this.dispatchGated(input, NotificationChannel.PUSH, input.push!.template, async () => {
          const devices = await this.pushDevices.listActiveUserDevices(input.userId!);
          for (const device of devices) {
            const { notificationId, deliveryId } = await this.createRecord(
              input,
              NotificationChannel.PUSH,
              input.push!.title,
              input.push!.context,
            );
            await this.pushDelivery.send({
              deliveryId,
              notificationId,
              to: device.deviceToken,
              template: input.push!.template,
              title: input.push!.title,
              body: input.push!.body,
              context: input.push!.context,
            });
          }
        }),
      );
    }
  }

  private async isolate(channel: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Dispatch failed for channel=${channel}: ${err.message}`,
        err.stack,
        this.context,
      );
    }
  }

  /**
   * In-app is the one channel that doesn't need `canReachUser` — it's
   * profileId-or-userId-keyed and guest-safe (no delivery-port network send,
   * the "send" is the Mongo write). Preference gating only applies when a
   * userId is known (no preference row can exist for an unclaimed profile);
   * a live SSE push additionally fires when userId is known.
   */
  private async dispatchInApp(
    input: DispatchInput,
    inApp: InAppNotificationRequest,
  ): Promise<void> {
    if (!input.profileId && !input.userId) {
      throw new Error('dispatchInApp requires at least one of profileId or userId');
    }

    if (input.userId) {
      const activeOverrides = await this.overrides.findActiveOverrides(input.category);
      const forced = activeOverrides.some((o) => o.forceDelivery);

      if (!forced) {
        const preference = await this.preferences.findPreference(
          input.userId,
          input.category,
          NotificationChannel.IN_APP,
        );
        if (preference && !preference.enabled) {
          this.logger.debug(
            `Skipping in-app notification: preference disabled [userId=${input.userId}, category=${input.category}]`,
            this.context,
          );
          return;
        }
      }
    }

    const notification = await this.notifications.create({
      profileId: input.profileId,
      userId: input.userId,
      category: input.category,
      eventType: input.eventType,
      channel: NotificationChannel.IN_APP,
      priority: NotificationPriority.NORMAL,
      subject: inApp.title,
      body: inApp.body,
      payload: inApp.metadata,
    });

    await this.inAppNotifications.create({
      notificationId: notification.id,
      profileId: input.profileId,
      userId: input.userId,
      type: inApp.type,
      title: inApp.title,
      body: inApp.body,
      actionUrl: inApp.actionUrl,
      icon: inApp.icon,
      metadata: inApp.metadata,
    });

    if (!input.userId) return;

    await this.redis
      .publish(`realtime:user:${input.userId}`, {
        eventId: notification.id,
        eventType: input.eventType,
        aggregateType: AggregateType.NOTIFICATION,
        aggregateId: notification.id,
        payload: {
          type: inApp.type,
          title: inApp.title,
          body: inApp.body,
          actionUrl: inApp.actionUrl,
        },
        timestamp: new Date().toISOString(),
      })
      .catch((err: Error) => {
        this.logger.warn(`In-app SSE publish failed: ${err.message}`, this.context);
      });
  }

  /** Compliance/security/financial override bypasses the recipient's normal
   * opt-out for this category; otherwise checks their per-channel preference. */
  private async dispatchGated(
    input: DispatchInput,
    channel:
      | typeof NotificationChannel.SMS
      | typeof NotificationChannel.WHATSAPP
      | typeof NotificationChannel.PUSH,
    template: unknown,
    send: () => Promise<void>,
  ): Promise<void> {
    const activeOverrides = await this.overrides.findActiveOverrides(input.category);
    const forced = activeOverrides.some((o) => o.forceDelivery);

    if (!forced) {
      const preference = await this.preferences.findPreference(
        input.userId!,
        input.category,
        channel,
      );
      if (preference && !preference.enabled) {
        this.logger.debug(
          `Skipping ${channel} (template=${String(template)}): preference disabled [userId=${input.userId}, category=${input.category}]`,
          this.context,
        );
        return;
      }
    }

    await send();
  }

  private async createRecord(
    input: DispatchInput,
    channel: (typeof NotificationChannel)[keyof typeof NotificationChannel],
    subject: string | undefined,
    context: Record<string, unknown>,
  ): Promise<{ notificationId: string; deliveryId: string }> {
    const notification = await this.notifications.create({
      profileId: input.profileId,
      userId: input.userId,
      category: input.category,
      eventType: input.eventType,
      channel,
      priority: NotificationPriority.NORMAL,
      subject,
      body: subject ?? input.category,
      payload: context,
    });

    const delivery = await this.deliveries.create({
      notificationId: notification.id,
      provider: this.providerFor(channel),
      channel:
        channel as (typeof NotificationProviderChannel)[keyof typeof NotificationProviderChannel],
      attemptNumber: 1,
      requestPayload: context,
    });

    return { notificationId: notification.id, deliveryId: delivery.id };
  }

  private providerFor(
    channel: (typeof NotificationChannel)[keyof typeof NotificationChannel],
  ): (typeof NotificationProvider)[keyof typeof NotificationProvider] {
    switch (channel) {
      case NotificationChannel.SMS:
      case NotificationChannel.WHATSAPP:
        return NotificationProvider.TWILIO;
      case NotificationChannel.PUSH:
        return NotificationProvider.FCM;
      case NotificationChannel.EMAIL:
      default:
        return NotificationProvider.SMTP;
    }
  }
}
