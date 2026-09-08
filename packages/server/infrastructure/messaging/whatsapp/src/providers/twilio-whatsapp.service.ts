import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Twilio from 'twilio';
import { WHATSAPP_RUNTIME_CONFIG_TOKEN, type WhatsAppRuntimeConfig } from '@workspace/ports/config';
import { WhatsAppMessage, WhatsAppProviderPort, WhatsAppSendResult } from '@workspace/ports';

@Injectable()
export class TwilioWhatsAppService implements WhatsAppProviderPort, OnModuleInit {
  private readonly logger = new Logger(TwilioWhatsAppService.name);
  private client!: Twilio.Twilio;
  private fromNumber!: string;

  constructor(
    @Inject(WHATSAPP_RUNTIME_CONFIG_TOKEN)
    private readonly config: WhatsAppRuntimeConfig,
  ) {}

  onModuleInit(): void {
    this.fromNumber = this.config.twilioWhatsAppFrom;
    this.client = Twilio(this.config.twilioAccountSid, this.config.twilioAuthToken);
    this.logger.log(`TwilioWhatsAppService initialized (from: whatsapp:${this.fromNumber})`);
  }

  async send(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const to = this.toWhatsAppAddress(message.to);
    const from = this.toWhatsAppAddress(this.fromNumber);

    try {
      if (message.templateSid) {
        // Template message — works outside the 24-hour session window
        const msg = await this.client.messages.create({
          from,
          to,
          contentSid: message.templateSid,
          contentVariables: message.templateVariables
            ? JSON.stringify(message.templateVariables)
            : undefined,
          messagingServiceSid: this.config.messagingServiceSid,
        });

        this.logger.log(
          `WhatsApp template message sent: notificationId=${message.notificationId ?? 'n/a'} sid=${msg.sid}`,
        );

        return { success: true, messageSid: msg.sid };
      }

      // Freeform message — only valid within the 24-hour customer care window
      const msg = await this.client.messages.create({
        from,
        to,
        body: message.message,
      });

      this.logger.log(
        `WhatsApp freeform message sent: notificationId=${message.notificationId ?? 'n/a'} sid=${msg.sid}`,
      );

      return { success: true, messageSid: msg.sid };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `WhatsApp send failed: notificationId=${message.notificationId ?? 'n/a'} error=${errMessage}`,
      );
      return { success: false, error: errMessage };
    }
  }

  /** Ensures number is in whatsapp:+E164 format. */
  private toWhatsAppAddress(raw: string): string {
    if (raw.startsWith('whatsapp:')) {
      return raw;
    }
    return `whatsapp:${raw}`;
  }
}
