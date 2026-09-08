import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_TEMPLATE_CATEGORY_MAP, EmailProviderPort, LOGGER_TOKEN, LoggerPort } from '@workspace/ports';
import { EMAIL_RUNTIME_CONFIG_TOKEN, type EmailRuntimeConfig } from '@workspace/ports/config';
import { EmailCategory } from '@workspace/constants';
import { EmailJobData } from '@workspace/types';
import { SmtpEmailService } from './smtp-email.service';
import { ResendEmailService } from './resend-email.service';
import { MailgunEmailService } from './mailgun-email.service';
import { MailtrapEmailService } from './mailtrap-email.service';

/**
 * Bound to EMAIL_TOKEN in place of a single fixed provider. Resolves which
 * EmailProviderPort handles a given message: explicit `category` override ->
 * category derived from `template` -> per-category provider from config ->
 * config's single `provider` as the final fallback. In `routingMode: 'single'`
 * (the default) it always uses `provider`, identical to the static factory
 * this replaced.
 */
@Injectable()
export class EmailProviderRouter extends EmailProviderPort {
  private readonly context = 'EmailProviderRouter';

  constructor(
    @Inject(EMAIL_RUNTIME_CONFIG_TOKEN) private readonly emailCfg: EmailRuntimeConfig,
    private readonly smtp: SmtpEmailService,
    private readonly resend: ResendEmailService,
    private readonly mailgun: MailgunEmailService,
    private readonly mailtrap: MailtrapEmailService,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
  }

  getProviderName(): string {
    return 'EmailProviderRouter';
  }

  async verifyConnection(): Promise<boolean> {
    return this.resolveSingleModeProvider().verifyConnection();
  }

  async sendEmail(emailData: EmailJobData): Promise<string | undefined> {
    return this.resolveProvider(emailData).sendEmail(emailData);
  }

  private resolveProvider(emailData: EmailJobData): EmailProviderPort {
    if (this.emailCfg.routingMode !== 'category') {
      return this.resolveSingleModeProvider();
    }

    const category = this.resolveCategory(emailData);
    const providerName =
      this.emailCfg.categoryProviderMap[category] ??
      this.emailCfg.categoryProviderMap[EmailCategory.DEFAULT] ??
      this.emailCfg.provider;

    return this.providerFor(providerName);
  }

  private resolveCategory(emailData: EmailJobData): EmailCategory {
    const category = emailData.category ?? EMAIL_TEMPLATE_CATEGORY_MAP[emailData.template];
    if (category && !Object.values(EmailCategory).includes(category)) {
      this.logger.warn(`Unknown email category "${category}", falling back to default`, this.context);
      return EmailCategory.DEFAULT;
    }
    return category ?? EmailCategory.DEFAULT;
  }

  private resolveSingleModeProvider(): EmailProviderPort {
    return this.providerFor(this.emailCfg.provider);
  }

  private providerFor(name: string): EmailProviderPort {
    switch (name.toLowerCase()) {
      case 'resend':
        return this.resend;
      case 'mailgun':
        return this.mailgun;
      case 'mailtrap':
        return this.mailtrap;
      case 'nodemailer':
      case 'smtp':
      default:
        return this.smtp;
    }
  }
}
