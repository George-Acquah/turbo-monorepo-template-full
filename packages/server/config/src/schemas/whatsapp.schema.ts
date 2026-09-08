import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { toOptionalString, toStringWithDefault } from '@/env.transforms';
import {
  WHATSAPP_PROVIDERS,
  type WhatsAppProvider,
  type WhatsAppRuntimeConfig,
} from '@workspace/ports/config';

export class WhatsAppEnvSchema {
  @Transform(toStringWithDefault('twilio'))
  @IsIn(WHATSAPP_PROVIDERS)
  WHATSAPP_PROVIDER: WhatsAppProvider = 'twilio';

  @Transform(toStringWithDefault(''))
  @IsString()
  TWILIO_ACCOUNT_SID = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  TWILIO_AUTH_TOKEN = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  TWILIO_WHATSAPP_FROM = '';

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  TWILIO_MESSAGING_SERVICE_SID?: string;

  @Transform(toStringWithDefault(''))
  @IsString()
  META_WHATSAPP_PHONE_NUMBER_ID = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  META_WHATSAPP_ACCESS_TOKEN = '';

  @Transform(toStringWithDefault('v21.0'))
  @IsString()
  META_WHATSAPP_API_VERSION = 'v21.0';
}

export function createWhatsAppConfig(schema: WhatsAppEnvSchema): WhatsAppRuntimeConfig {
  return {
    provider: schema.WHATSAPP_PROVIDER,
    twilioAccountSid: schema.TWILIO_ACCOUNT_SID,
    twilioAuthToken: schema.TWILIO_AUTH_TOKEN,
    twilioWhatsAppFrom: schema.TWILIO_WHATSAPP_FROM,
    messagingServiceSid: schema.TWILIO_MESSAGING_SERVICE_SID,
    metaPhoneNumberId: schema.META_WHATSAPP_PHONE_NUMBER_ID,
    metaAccessToken: schema.META_WHATSAPP_ACCESS_TOKEN,
    metaApiVersion: schema.META_WHATSAPP_API_VERSION,
  };
}
