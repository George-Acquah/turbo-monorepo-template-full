/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailProviderPort, LOGGER_TOKEN, LoggerPort } from '@workspace/ports';
import { EmailAddress, EmailJobData } from '@workspace/types';
import {
  APP_RUNTIME_CONFIG_TOKEN,
  EMAIL_RUNTIME_CONFIG_TOKEN,
  type AppRuntimeConfig,
  type EmailRuntimeConfig,
} from '@workspace/ports/config';
import { formatEmailAddress, formatResolvedSender, resolveEmailSender } from './sender-address';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  from: { name: string; email: string };
}

@Injectable()
export class SmtpEmailService extends EmailProviderPort {
  private transporter!: nodemailer.Transporter;
  private config: SmtpConfig;
  private readonly context = 'SmtpEmailService';

  constructor(
    @Inject(EMAIL_RUNTIME_CONFIG_TOKEN) private readonly emailCfg: EmailRuntimeConfig,
    @Inject(APP_RUNTIME_CONFIG_TOKEN) private readonly appCfg: AppRuntimeConfig,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
  ) {
    super();
    const sender = resolveEmailSender(emailCfg, 'smtp');
    this.config = {
      host: emailCfg.host,
      port: emailCfg.port,
      secure: emailCfg.secure,
      auth: {
        user: emailCfg.user,
        pass: emailCfg.password,
      },
      from: {
        name: sender.name,
        email: sender.email,
      },
    };

    this.initializeTransporter();
  }

  getProviderName(): string {
    return 'Nodemailer';
  }

  private initializeTransporter(): void {
    this.logger.log(
      `Initializing email transporter host=${this.config.host} port=${this.config.port}`,
      this.context,
    );

    const transportConfig: any = {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure, // STARTTLS uses secure=false
      // CRITICAL: Add timeouts to prevent hanging connections on cloud platforms
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
      // Enable debug logging in development
      debug: this.appCfg.nodeEnv === 'development',
      logger: this.appCfg.nodeEnv === 'development',
    };

    // Only include auth if credentials are provided
    if (this.config.auth.user && this.config.auth.pass) {
      transportConfig.auth = {
        user: this.config.auth.user,
        pass: this.config.auth.pass,
      };
    }

    // For cloud platforms like Render, add TLS options
    if (this.config.host.includes('mailtrap') || this.config.host.includes('smtp')) {
      transportConfig.tls = {
        // Don't fail on invalid certificates (for development)
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      };
    }

    this.transporter = nodemailer.createTransport(transportConfig);

    if (!this.config.auth.user || !this.config.auth.pass) {
      this.logger.warn(
        'Email credentials not configured - emails will be sent without authentication',
        this.context,
      );
      return;
    }

    if (!this.emailCfg.verifyTransporter) {
      this.logger.log(
        'Email transporter verification skipped (set VERIFY_EMAIL_TRANSPORTER=true to enable)',
        this.context,
      );
      return;
    }

    // Verify connection asynchronously (don't block startup)
    this.transporter
      .verify()
      .then(() => this.logger.log('Email transporter is READY', this.context))
      .catch((err) =>
        this.logger.error(
          'Email transporter verification FAILED:',
          err instanceof Error ? err.stack : String(err),
          this.context,
        ),
      );
  }

  private formatEmailAddresses(
    addresses: EmailAddress | EmailAddress[] | undefined,
  ): string | string[] | undefined {
    if (!addresses) return undefined;
    if (Array.isArray(addresses)) {
      return addresses.map((addr) => formatEmailAddress(addr));
    }
    return formatEmailAddress(addresses);
  }

  async sendEmail(emailData: EmailJobData): Promise<string | undefined> {
    try {
      const overrideTo = this.emailCfg.overrideTo;
      const to = overrideTo ? overrideTo : this.formatEmailAddresses(emailData.to);

      if (overrideTo) {
        this.logger.warn(
          `EMAIL_OVERRIDE_TO is set — redirecting email to <${overrideTo}> (original: ${JSON.stringify(emailData.to)})`,
          this.context,
        );
      }

      const mailOptions = {
        from: emailData.from
          ? formatEmailAddress(emailData.from)
          : formatResolvedSender(this.config.from),
        to,
        replyTo: emailData.replyTo ? formatEmailAddress(emailData.replyTo) : undefined,
        subject: emailData.subject,
        template: emailData.template,
        html: emailData.htmlBody,
        text: emailData.body,
        attachments: emailData.attachments,
        priority: (emailData.priority === 1
          ? 'high'
          : emailData.priority === 10
            ? 'low'
            : 'normal') as 'high' | 'low' | 'normal',
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${(info as any).messageId}`, this.context);

      const testUrl = nodemailer.getTestMessageUrl(info as any);
      if (testUrl) {
        this.logger.debug(`📧 Email preview URL: ${testUrl}`, this.context);
      }

      return (info as any).messageId;
    } catch (error) {
      this.logger.error(
        'Failed to send email:',
        error instanceof Error ? error.stack : String(error),
        this.context,
      );
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.config.auth.user || !this.config.auth.pass) {
      this.logger.warn('Email credentials not configured', this.context);
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.log('Email connection verified', this.context);
      return true;
    } catch (error) {
      this.logger.error(
        'Email connection verification failed:',
        error instanceof Error ? error.stack : String(error),
        this.context,
      );
      return false;
    }
  }
}
