import { SmsJobData } from '@workspace/types';

export const SMS_DELIVERY_PORT = Symbol('SMS_DELIVERY_PORT');

export type SmsDeliveryRequest = SmsJobData;

export abstract class SmsDeliveryPort {
  abstract send(request: SmsDeliveryRequest): Promise<string | undefined>;
}
