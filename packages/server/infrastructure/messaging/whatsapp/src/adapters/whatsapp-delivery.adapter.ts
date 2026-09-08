import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  WHATSAPP_PROVIDER_TOKEN,
  WhatsAppDeliveryPort,
  WhatsAppDeliveryRequest,
  WhatsAppProviderPort,
} from '@workspace/ports';
import { WhatsAppTemplateRenderingService } from '../services/whatsapp-template-rendering.service';

/**
 * Wraps the existing WhatsAppProviderPort (raw phone+text/template send) into
 * the uniform deliveryId/notificationId job-data convention the other
 * channels use — the real Twilio/Meta send logic is untouched.
 */
@Injectable()
export class WhatsAppDeliveryAdapter implements WhatsAppDeliveryPort {
  constructor(
    @Inject(WHATSAPP_PROVIDER_TOKEN) private readonly provider: WhatsAppProviderPort,
    private readonly templateRenderer: WhatsAppTemplateRenderingService,
  ) {}

  async send(request: WhatsAppDeliveryRequest): Promise<string | undefined> {
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
