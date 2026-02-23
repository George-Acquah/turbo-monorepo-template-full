/**
 * Email Delivery Port - shared abstraction for delivering emails from processors
 * Implementations should be registered by concrete email providers (e.g., @repo/email)
 */

import { EmailJobData } from '@repo/types';

export const EMAIL_DELIVERY_PORT = Symbol('EMAIL_DELIVERY_PORT');

export type EmailDeliveryRequest = EmailJobData;

export abstract class EmailDeliveryPort {
  abstract send(request: EmailDeliveryRequest): Promise<string | undefined>;
}

export abstract class TemplateRendererPort {
  abstract render(template: string, variables: Record<string, unknown>): string;
  abstract renderFromFile(
    templateName: string,
    variables: Record<string, unknown>,
  ): Promise<string>;
  abstract wrapHtml?(content: string, variables?: Record<string, unknown>): Promise<string>;
}

export const TEMPLATE_RENDERER_TOKEN = Symbol('TEMPLATE_RENDERER_TOKEN');
