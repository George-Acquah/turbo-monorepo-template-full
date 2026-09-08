import { Module, Global } from '@nestjs/common';
import { TemplateModule } from '@workspace/templates';
import {
  EMAIL_DELIVERY_PORT,
  EMAIL_RESEND_TOKEN,
  EMAIL_MAILGUN_TOKEN,
  EMAIL_MAILTRAP_TOKEN,
  EMAIL_SMTP_TOKEN,
  EMAIL_TOKEN,
} from '@workspace/ports';
import { SmtpEmailService } from './providers/smtp-email.service';
import { ResendEmailService } from './providers/resend-email.service';
import { MailgunEmailService } from './providers/mailgun-email.service';
import { MailtrapEmailService } from './providers/mailtrap-email.service';
import { EmailProviderRouter } from './providers/email-provider.router';
import { EmailTemplateRenderingService } from './services/email-template-rendering.service';
import { EmailDeliveryAdapter } from './adapters/email-delivery.adapter';

const emailProviderFactory = {
  provide: EMAIL_TOKEN,
  useExisting: EmailProviderRouter,
};

@Global()
@Module({
  imports: [TemplateModule],
  providers: [
    // Create exactly ONE instance of each provider
    SmtpEmailService,
    ResendEmailService,
    MailgunEmailService,
    MailtrapEmailService,
    EmailProviderRouter,

    // Alias tokens to those same instances
    { provide: EMAIL_SMTP_TOKEN, useExisting: SmtpEmailService },
    { provide: EMAIL_RESEND_TOKEN, useExisting: ResendEmailService },
    { provide: EMAIL_MAILGUN_TOKEN, useExisting: MailgunEmailService },
    { provide: EMAIL_MAILTRAP_TOKEN, useExisting: MailtrapEmailService },
    emailProviderFactory,

    EmailTemplateRenderingService,
    EmailDeliveryAdapter,
    { provide: EMAIL_DELIVERY_PORT, useExisting: EmailDeliveryAdapter },
  ],
  exports: [
    EMAIL_DELIVERY_PORT,
    EMAIL_TOKEN,
    EMAIL_SMTP_TOKEN,
    EMAIL_RESEND_TOKEN,
    EMAIL_MAILGUN_TOKEN,
    EMAIL_MAILTRAP_TOKEN,
  ],
})
export class EmailModule {}
