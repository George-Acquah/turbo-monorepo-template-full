import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { toStringWithDefault } from '@/env.transforms';
import type { SmsRuntimeConfig } from '@workspace/ports/config';

/**
 * Reuses TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN — the same Twilio account
 * already configured for WhatsApp (EmailEnvSchema) — SMS is just a different
 * `from` number on the same account. Declared as its own class (rather than
 * added to EmailEnvSchema, the way WhatsApp was) since SMS is genuinely its
 * own feature area.
 */
export class SmsEnvSchema {
  @Transform(toStringWithDefault(''))
  @IsString()
  TWILIO_ACCOUNT_SID = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  TWILIO_AUTH_TOKEN = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  TWILIO_SMS_FROM = '';
}

export function createSmsConfig(schema: SmsEnvSchema): SmsRuntimeConfig {
  return {
    twilioAccountSid: schema.TWILIO_ACCOUNT_SID,
    twilioAuthToken: schema.TWILIO_AUTH_TOKEN,
    twilioSmsFrom: schema.TWILIO_SMS_FROM,
  };
}
