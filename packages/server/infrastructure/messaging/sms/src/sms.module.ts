import { Global, Module } from '@nestjs/common';
import { TemplateModule } from '@workspace/templates';
import { SMS_DELIVERY_PORT, SMS_PROVIDER_TOKEN } from '@workspace/ports';
import { TwilioSmsService } from './providers/twilio-sms.service';
import { SmsTemplateRenderingService } from './services/sms-template-rendering.service';
import { SmsDeliveryAdapter } from './adapters/sms-delivery.adapter';

/**
 * Twilio-only for now — reuses the same account credentials already
 * configured for WhatsApp. Structured behind SmsProviderPort so a second
 * provider (e.g. Vonage) could be added later exactly like WhatsApp's
 * twilio/meta split, without touching any consumer.
 */
@Global()
@Module({
  imports: [TemplateModule],
  providers: [
    TwilioSmsService,
    { provide: SMS_PROVIDER_TOKEN, useExisting: TwilioSmsService },
    SmsTemplateRenderingService,
    SmsDeliveryAdapter,
    { provide: SMS_DELIVERY_PORT, useExisting: SmsDeliveryAdapter },
  ],
  exports: [SMS_PROVIDER_TOKEN, SMS_DELIVERY_PORT],
})
export class SmsModule {}
