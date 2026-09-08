import { Inject, Injectable } from '@nestjs/common';
import { EmailProviderPort, LOGGER_TOKEN, LoggerPort } from '@workspace/ports';
import { EmailAddress, EmailJobData } from '@workspace/types';
import { EMAIL_RUNTIME_CONFIG_TOKEN, type EmailRuntimeConfig } from '@workspace/ports/config';
import { resolveEmailSender } from './sender-address';

const MAILTRAP_SEND_URL = 'https://send.api.mailtrap.io/api/send';

interface MailtrapAddress {
  email: string;
  name?: string;
}

interface MailtrapSendRequest {
  from: MailtrapAddress;
  to: MailtrapAddress[];
  cc?: MailtrapAddress[];
  bcc?: MailtrapAddress[];
  reply_to?: MailtrapAddress;
  subject: string;
  text?: string;
  html?: string;
}

interface MailtrapSendSuccessResponse {
  success: true;
  message_ids: string[];
}

interface MailtrapSendErrorResponse {
  success: false;
  errors: string[];
}

type MailtrapSendResponse = MailtrapSendSuccessResponse | MailtrapSendErrorResponse;

function isMailtrapSendResponse(value: unknown): value is MailtrapSendResponse {
  return typeof value === 'object' && value !== null && 'success' in value;
}

/**
 * Adapter for Mailtrap's transactional "Sending API" (send.api.mailtrap.io) —
 * NOT Mailtrap's Testing/sandbox SMTP product, which SmtpEmailService already
 * has an unrelated TLS special-case for and continues to serve non-prod SMTP
 * testing unchanged. This adapter is a real production sender used via the
 * `mailtrap` EmailProvider routing category.
 *
 * Uses the platform's global `fetch` directly rather than an SDK — Mailtrap's
 * Sending API is a plain REST/JSON endpoint, so no extra dependency is needed.
 */
@Injectable()
export class MailtrapEmailService extends EmailProviderPort {
  private readonly context = 'MailtrapEmailService';
  private readonly apiToken: string | undefined;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(
    @Inject(EMAIL_RUNTIME_CONFIG_TOKEN) private readonly emailCfg: EmailRuntimeConfig,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
    const sender = resolveEmailSender(emailCfg, 'mailtrap');
    this.fromEmail = sender.email;
    this.fromName = sender.name;
    this.apiToken = emailCfg.mailtrapApiToken;

    if (!this.apiToken) {
      this.logger.warn('Mailtrap API token not configured (MAILTRAP_API_TOKEN)', this.context);
    }
  }

  getProviderName(): string {
    return 'Mailtrap';
  }

  async sendEmail(emailData: EmailJobData): Promise<string | undefined> {
    if (!this.apiToken) {
      this.logger.warn('Mailtrap not configured', this.context);
      throw new Error('Mailtrap not configured');
    }

    try {
      const from = emailData.from
        ? this.toMailtrapAddress(emailData.from)
        : { email: this.fromEmail, name: this.fromName };

      const body: MailtrapSendRequest = {
        from,
        to: this.toAddressList(emailData.to),
        subject: emailData.subject,
        cc: emailData.cc?.map((address) => this.toMailtrapAddress(address)),
        bcc: emailData.bcc?.map((address) => this.toMailtrapAddress(address)),
        reply_to: emailData.replyTo ? this.toMailtrapAddress(emailData.replyTo) : undefined,
        ...(emailData.htmlBody ? { html: emailData.htmlBody } : { text: emailData.body ?? '' }),
      };

      const response = await fetch(MAILTRAP_SEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const payload: unknown = await response.json().catch(() => undefined);

      if (!response.ok || !isMailtrapSendResponse(payload) || !payload.success) {
        const errors =
          isMailtrapSendResponse(payload) && !payload.success ? payload.errors.join(', ') : response.statusText;
        throw new Error(`Mailtrap error (${response.status}): ${errors}`);
      }

      const messageId = payload.message_ids[0];
      this.logger.log(`Email sent via Mailtrap: ${messageId}`, this.context);
      return messageId;
    } catch (error) {
      this.logger.error(
        'Failed to send email via Mailtrap:',
        error instanceof Error ? error.stack : String(error),
        this.context,
      );
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.apiToken) {
      this.logger.warn('Mailtrap API token not configured', this.context);
      return false;
    }
    return true;
  }

  private toAddressList(addresses: EmailAddress | EmailAddress[]): MailtrapAddress[] {
    return Array.isArray(addresses)
      ? addresses.map((address) => this.toMailtrapAddress(address))
      : [this.toMailtrapAddress(addresses)];
  }

  private toMailtrapAddress(address: EmailAddress | string): MailtrapAddress {
    if (typeof address === 'string') {
      return { email: address };
    }
    return address.name ? { email: address.email, name: address.name } : { email: address.email };
  }
}
