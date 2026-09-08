import { WhatsAppMessage, WhatsAppSendResult } from './whatsapp.interface';

export abstract class WhatsAppProviderPort {
  abstract send(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
}

export const WHATSAPP_PROVIDER_TOKEN = Symbol('WHATSAPP_PROVIDER_TOKEN');
