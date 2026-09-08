import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { SmsDeliveryPort, SmsDeliveryRequest, SmsProviderPort, SMS_PROVIDER_TOKEN } from '@workspace/ports';
import { SmsTemplateRenderingService } from '../services/sms-template-rendering.service';

@Injectable()
export class SmsDeliveryAdapter implements SmsDeliveryPort {
  constructor(
    @Inject(SMS_PROVIDER_TOKEN) private readonly provider: SmsProviderPort,
    private readonly templateRenderer: SmsTemplateRenderingService,
  ) {}

  async send(request: SmsDeliveryRequest): Promise<string | undefined> {
    if (!request.deliveryId) throw new UnprocessableEntityException();

    const rendered = await this.templateRenderer.renderIfNeeded(request);

    const result = await this.provider.send({
      to: rendered.to,
      message: rendered.body ?? '',
      notificationId: rendered.notificationId,
    });

    return result.success ? result.messageSid : undefined;
  }
}
