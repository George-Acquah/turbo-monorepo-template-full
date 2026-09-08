import { SmsMessage, SmsSendResult } from './sms.interface';

export abstract class SmsProviderPort {
  abstract send(message: SmsMessage): Promise<SmsSendResult>;
}

export const SMS_PROVIDER_TOKEN = Symbol('SMS_PROVIDER_TOKEN');
