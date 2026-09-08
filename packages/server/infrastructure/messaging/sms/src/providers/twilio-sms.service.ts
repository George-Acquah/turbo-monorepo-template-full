import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Twilio from 'twilio';
import { SMS_RUNTIME_CONFIG_TOKEN, type SmsRuntimeConfig } from '@workspace/ports/config';
import { SmsMessage, SmsProviderPort, SmsSendResult } from '@workspace/ports';

@Injectable()
export class TwilioSmsService implements SmsProviderPort, OnModuleInit {
  private readonly logger = new Logger(TwilioSmsService.name);
  private client!: Twilio.Twilio;
  private fromNumber!: string;

  constructor(
    @Inject(SMS_RUNTIME_CONFIG_TOKEN)
    private readonly config: SmsRuntimeConfig,
  ) {}

  onModuleInit(): void {
    this.fromNumber = this.config.twilioSmsFrom;
    this.client = Twilio(this.config.twilioAccountSid, this.config.twilioAuthToken);
    this.logger.log(`TwilioSmsService initialized (from: ${this.fromNumber})`);
  }

  async send(message: SmsMessage): Promise<SmsSendResult> {
    try {
      const msg = await this.client.messages.create({
        from: this.fromNumber,
        to: message.to,
        body: message.message,
      });

      this.logger.log(
        `SMS sent: notificationId=${message.notificationId ?? 'n/a'} sid=${msg.sid}`,
      );

      return { success: true, messageSid: msg.sid };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `SMS send failed: notificationId=${message.notificationId ?? 'n/a'} error=${errMessage}`,
      );
      return { success: false, error: errMessage };
    }
  }
}
