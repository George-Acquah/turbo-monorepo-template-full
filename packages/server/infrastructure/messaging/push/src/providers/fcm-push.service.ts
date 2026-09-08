import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { PUSH_RUNTIME_CONFIG_TOKEN, type PushRuntimeConfig } from '@workspace/ports/config';
import { PushMessage, PushProviderPort, PushSendResult } from '@workspace/ports';

@Injectable()
export class FcmPushService implements PushProviderPort, OnModuleInit {
  private readonly logger = new Logger(FcmPushService.name);
  private app!: App;
  private messaging!: Messaging;

  constructor(
    @Inject(PUSH_RUNTIME_CONFIG_TOKEN)
    private readonly config: PushRuntimeConfig,
  ) {}

  onModuleInit(): void {
    if (!this.config.fcmProjectId || !this.config.fcmClientEmail || !this.config.fcmPrivateKey) {
      // An unconfigured optional channel shouldn't crash the whole worker —
      // firebase-admin's cert() validates the credential shape eagerly and
      // throws synchronously if it's incomplete.
      this.logger.warn('FcmPushService not configured (FCM_* env vars empty) — push disabled');
      return;
    }

    this.app = initializeApp({
      credential: cert({
        projectId: this.config.fcmProjectId,
        clientEmail: this.config.fcmClientEmail,
        privateKey: this.config.fcmPrivateKey,
      }),
    });
    this.messaging = getMessaging(this.app);
    this.logger.log(`FcmPushService initialized (project: ${this.config.fcmProjectId})`);
  }

  async send(message: PushMessage): Promise<PushSendResult> {
    if (!this.messaging) {
      return { success: false, error: 'FCM is not configured' };
    }

    try {
      const messageId = await this.messaging.send({
        token: message.deviceToken,
        notification: { title: message.title, body: message.body },
        data: message.data,
      });

      this.logger.log(
        `Push sent: notificationId=${message.notificationId ?? 'n/a'} messageId=${messageId}`,
      );

      return { success: true, messageId };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Push send failed: notificationId=${message.notificationId ?? 'n/a'} error=${errMessage}`,
      );
      return { success: false, error: errMessage };
    }
  }
}
