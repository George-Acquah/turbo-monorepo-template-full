import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  PUSH_PROVIDER_TOKEN,
  PushDeliveryPort,
  PushDeliveryRequest,
  PushProviderPort,
} from '@workspace/ports';

@Injectable()
export class PushDeliveryAdapter implements PushDeliveryPort {
  constructor(@Inject(PUSH_PROVIDER_TOKEN) private readonly provider: PushProviderPort) {}

  async send(request: PushDeliveryRequest): Promise<string | undefined> {
    if (!request.deliveryId) throw new UnprocessableEntityException();

    const result = await this.provider.send({
      deviceToken: request.to,
      title: request.title,
      body: request.body,
      data: Object.fromEntries(
        Object.entries(request.context).map(([k, v]) => [k, String(v)]),
      ),
      notificationId: request.notificationId,
    });

    return result.success ? result.messageId : undefined;
  }
}
