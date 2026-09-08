import { WhatsAppJobData } from '@workspace/types';

export const WHATSAPP_DELIVERY_PORT = Symbol('WHATSAPP_DELIVERY_PORT');

export type WhatsAppDeliveryRequest = WhatsAppJobData;

export abstract class WhatsAppDeliveryPort {
  abstract send(request: WhatsAppDeliveryRequest): Promise<string | undefined>;
}
