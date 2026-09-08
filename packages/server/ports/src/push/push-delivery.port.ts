import { PushJobData } from '@workspace/types';

export const PUSH_DELIVERY_PORT = Symbol('PUSH_DELIVERY_PORT');

export type PushDeliveryRequest = PushJobData;

export abstract class PushDeliveryPort {
  abstract send(request: PushDeliveryRequest): Promise<string | undefined>;
}
