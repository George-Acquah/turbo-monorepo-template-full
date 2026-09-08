import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { WHATSAPP_RUNTIME_CONFIG_TOKEN, type WhatsAppRuntimeConfig } from '@workspace/ports/config';
import {
  HTTP_PORT_TOKEN,
  HttpPort,
  LOGGER_TOKEN,
  LoggerPort,
  WhatsAppMessage,
  WhatsAppProviderPort,
  WhatsAppSendResult,
} from '@workspace/ports';

/** Shape of a successful Graph API /messages response. */
interface MetaSendResponse {
  messaging_product: 'whatsapp';
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

/** Shape of a Graph API error envelope. */
interface MetaErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

@Injectable()
export class MetaCloudWhatsAppService implements WhatsAppProviderPort, OnModuleInit {
  private readonly context = MetaCloudWhatsAppService.name;
  private baseUrl!: string;
  private authHeader!: Record<string, string>;

  constructor(
    @Inject(WHATSAPP_RUNTIME_CONFIG_TOKEN)
    private readonly config: WhatsAppRuntimeConfig,
    @Inject(HTTP_PORT_TOKEN)
    private readonly http: HttpPort,
    @Inject(LOGGER_TOKEN)
    private readonly logger: LoggerPort,
  ) {}

  onModuleInit(): void {
    const { metaApiVersion, metaPhoneNumberId } = this.config;
    this.baseUrl = `https://graph.facebook.com/${metaApiVersion}/${metaPhoneNumberId}/messages`;
    this.authHeader = { Authorization: `Bearer ${this.config.metaAccessToken}` };
    this.logger.log(
      `MetaCloudWhatsAppService initialized (phoneNumberId=${metaPhoneNumberId}, api=${metaApiVersion})`,
      this.context,
    );
  }

  async send(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const to = this.normalizeE164(message.to);
    const body = message.templateSid
      ? this.buildTemplatePayload(to, message)
      : this.buildTextPayload(to, message.message);

    try {
      const response = await this.http.post<MetaSendResponse>(this.baseUrl, body, {
        headers: this.authHeader,
        retries: 2,
        timeout: 15_000,
        noRetryStatuses: [400, 401, 403, 404, 422],
      });

      const messageId = response.messages?.[0]?.id;

      this.logger.log(
        `WhatsApp message sent via Meta: notificationId=${message.notificationId ?? 'n/a'} wamid=${messageId}`,
        this.context,
      );

      return { success: true, messageSid: messageId };
    } catch (error) {
      const detail = this.extractErrorDetail(error);
      this.logger.error(
        `WhatsApp send failed via Meta: notificationId=${message.notificationId ?? 'n/a'} error=${detail}`,
        undefined,
        this.context,
      );
      return { success: false, error: detail };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  private buildTextPayload(to: string, text: string): Record<string, unknown> {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    };
  }

  private buildTemplatePayload(to: string, message: WhatsAppMessage): Record<string, unknown> {
    const components: Record<string, unknown>[] = [];

    if (message.templateVariables && Object.keys(message.templateVariables).length > 0) {
      const parameters = Object.entries(message.templateVariables)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, value]) => ({ type: 'text', text: value }));

      components.push({ type: 'body', parameters });
    }

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: message.templateSid,
        language: { code: 'en' },
        ...(components.length > 0 ? { components } : {}),
      },
    };
  }

  /** Strip leading '+' and 'whatsapp:' prefixes — Meta expects bare digits. */
  private normalizeE164(raw: string): string {
    return raw.replace(/^whatsapp:/, '').replace(/^\+/, '');
  }

  /** Best-effort extraction of a human-readable error from Meta or Axios shapes. */
  private extractErrorDetail(error: unknown): string {
    if (error && typeof error === 'object') {
      // Axios-style wrapped response
      const data = (error as { response?: { data?: MetaErrorResponse } }).response?.data;
      if (data?.error?.message) {
        const e = data.error;
        return `[${e.code}${e.error_subcode ? `.${e.error_subcode}` : ''}] ${e.message}`;
      }
    }
    return error instanceof Error ? error.message : String(error);
  }
}
