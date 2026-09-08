import { Inject, Injectable } from '@nestjs/common';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { EmailProviderPort, LOGGER_TOKEN, LoggerPort } from '@workspace/ports';
import { EmailAddress, EmailJobData } from '@workspace/types';
import { EMAIL_RUNTIME_CONFIG_TOKEN, type EmailRuntimeConfig } from '@workspace/ports/config';
import { formatEmailAddress, formatResolvedSender, resolveEmailSender } from './sender-address';

const MAILGUN_BASE_URL: Record<'us' | 'eu', string> = {
  us: 'https://api.mailgun.net',
  eu: 'https://api.eu.mailgun.net',
};

@Injectable()
export class MailgunEmailService extends EmailProviderPort {
  private readonly context = 'MailgunEmailService';
  private readonly client: ReturnType<Mailgun['client']> | undefined;
  private readonly domain: string | undefined;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(
    @Inject(EMAIL_RUNTIME_CONFIG_TOKEN) private readonly emailCfg: EmailRuntimeConfig,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
    const sender = resolveEmailSender(emailCfg, 'mailgun');
    this.fromEmail = sender.email;
    this.fromName = sender.name;
    this.domain = emailCfg.mailgunDomain;

    if (emailCfg.mailgunApiKey && emailCfg.mailgunDomain) {
      const mailgun = new Mailgun(FormData);
      this.client = mailgun.client({
        username: 'api',
        key: emailCfg.mailgunApiKey,
        url: MAILGUN_BASE_URL[emailCfg.mailgunRegion ?? 'us'],
      });
    } else {
      this.logger.warn(
        'Mailgun not fully configured (MAILGUN_API_KEY / MAILGUN_DOMAIN)',
        this.context,
      );
    }
  }

  getProviderName(): string {
    return 'Mailgun';
  }

  async sendEmail(emailData: EmailJobData): Promise<string | undefined> {
    if (!this.client || !this.domain) {
      this.logger.warn('Mailgun not configured', this.context);
      throw new Error('Mailgun not configured');
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
        'h:Reply-To': emailData.replyTo ? formatEmailAddress(emailData.replyTo) : undefined,
      };

      // mailgun.js requires exactly one of html/text to be a definite string,
      // not `string | undefined` — branch instead of passing both keys optionally.
      const result = emailData.htmlBody
        ? await this.client.messages.create(this.domain, { ...base, html: emailData.htmlBody })
        : await this.client.messages.create(this.domain, { ...base, text: emailData.body ?? '' });

      this.logger.log(`Email sent via Mailgun: ${result.id}`, this.context);
      return result.id;
    } catch (error) {
      this.logger.error(
        'Failed to send email via Mailgun:',
        error instanceof Error ? error.stack : String(error),
        this.context,
      );
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.client || !this.domain) {
      this.logger.warn('Mailgun not configured', this.context);
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
