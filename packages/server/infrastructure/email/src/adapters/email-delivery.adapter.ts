import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  EMAIL_TOKEN,
  EmailDeliveryPort,
  EmailDeliveryRequest,
  EmailProviderPort,
} from '@workspace/ports';
import { EmailTemplateRenderingService } from '../services/email-template-rendering.service';
import { EmailJobData } from '@workspace/types';

@Injectable()
export class EmailDeliveryAdapter implements EmailDeliveryPort {
  constructor(
    @Inject(EMAIL_TOKEN) private readonly provider: EmailProviderPort,
    private readonly templateRenderer: EmailTemplateRenderingService,
  ) {}

  async send(request: EmailDeliveryRequest): Promise<string | undefined> {
    if (!request.deliveryId) throw new UnprocessableEntityException();

    let jobData: EmailJobData = {
      to: request.to,
      deliveryId: request.deliveryId,
      subject: request.subject,
      template: request.template,
      context: request.context ?? {},
      from: request.from,
      replyTo: request.replyTo,
      body: request.body,
      htmlBody: request.htmlBody,
      attachments: request.attachments,
      priority: request.priority,
      notificationId: request.notificationId,
      category: request.category,
    };

    jobData = await this.templateRenderer.renderIfNeeded(jobData);

    return this.provider.sendEmail(jobData);
  }
}
