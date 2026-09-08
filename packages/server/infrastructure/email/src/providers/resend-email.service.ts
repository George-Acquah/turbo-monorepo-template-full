import { Inject, Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailProviderPort, LOGGER_TOKEN, LoggerPort } from '@workspace/ports';
import { EmailAddress, EmailJobData } from '@workspace/types';
import { EMAIL_RUNTIME_CONFIG_TOKEN, type EmailRuntimeConfig } from '@workspace/ports/config';
import { formatEmailAddress, formatResolvedSender, resolveEmailSender } from './sender-address';

@Injectable()
export class ResendEmailService extends EmailProviderPort {
  private readonly context = 'ResendEmailService';
  private readonly client: Resend | undefined;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(
    @Inject(EMAIL_RUNTIME_CONFIG_TOKEN) private readonly emailCfg: EmailRuntimeConfig,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
    const sender = resolveEmailSender(emailCfg, 'resend');
    this.fromEmail = sender.email;
    this.fromName = sender.name;

    if (emailCfg.resendApiKey) {
      this.client = new Resend(emailCfg.resendApiKey);
    } else {
      this.logger.warn('Resend API key not configured (RESEND_API_KEY)', this.context);
    }
  }

  getProviderName(): string {
    return 'Resend';
  }

  async sendEmail(emailData: EmailJobData): Promise<string | undefined> {
    if (!this.client) {
      this.logger.warn('Resend not configured', this.context);
      throw new Error('Resend not configured');
    }

    try {
      const from = emailData.from
        ? formatEmailAddress(emailData.from)
        : formatResolvedSender({ email: this.fromEmail, name: this.fromName });

      const base = {
        from,
        to: this.toAddressList(emailData.to),
        subject: emailData.subject,
        cc: emailData.cc?.map((address) => formatEmailAddress(address)),
        bcc: emailData.bcc?.map((address) => formatEmailAddress(address)),
        replyTo: emailData.replyTo ? formatEmailAddress(emailData.replyTo) : undefined,
        attachments: emailData.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
        })),
      };

      // Resend requires exactly one of html/text to be a definite string, not
      // `string | undefined` — branch instead of passing both keys optionally.
      const { data, error } = emailData.htmlBody
        ? await this.client.emails.send({ ...base, html: emailData.htmlBody })
        : await this.client.emails.send({ ...base, text: emailData.body ?? '' });

      if (error) {
        throw new Error(`Resend error (${error.name}): ${error.message}`);
      }

      this.logger.log(`Email sent via Resend: ${data?.id}`, this.context);
      return data?.id;
    } catch (error) {
      this.logger.error(
        'Failed to send email via Resend:',
        error instanceof Error ? error.stack : String(error),
        this.context,
      );
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('Resend API key not configured', this.context);
      return false;
    }
    return true;
  }

  private toAddressList(addresses: EmailAddress | EmailAddress[]): string[] {
    return Array.isArray(addresses)
      ? addresses.map((address) => formatEmailAddress(address))
      : [formatEmailAddress(addresses)];
  }
}
