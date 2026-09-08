import { PushMessage, PushSendResult } from './push.interface';

export abstract class PushProviderPort {
  abstract send(message: PushMessage): Promise<PushSendResult>;
}

export const PUSH_PROVIDER_TOKEN = Symbol('PUSH_PROVIDER_TOKEN');
