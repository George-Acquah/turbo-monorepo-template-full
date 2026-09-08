import { describe, it, expect, beforeEach } from '@jest/globals';
import type { EmailJobData } from '@workspace/types';
import type { EmailProviderPort, LoggerPort } from '@workspace/ports';
import type { EmailRuntimeConfig } from '@workspace/ports/config';
import { EmailCategory } from '@workspace/constants';
import { createMock } from '@workspace/testing/jest';
import { EmailProviderRouter } from '../src/providers/email-provider.router';
import type { SmtpEmailService } from '../src/providers/smtp-email.service';
import type { ResendEmailService } from '../src/providers/resend-email.service';
import type { MailgunEmailService } from '../src/providers/mailgun-email.service';
import type { MailtrapEmailService } from '../src/providers/mailtrap-email.service';

type MockProvider = ReturnType<typeof createMock<Pick<EmailProviderPort, 'sendEmail' | 'verifyConnection'>>>;

function baseJob(overrides: Partial<EmailJobData> = {}): EmailJobData {
  return {
    deliveryId: 'dlv_1',
    to: { email: 'member@example.com' },
    subject: 'Test subject',
    template: 'user-welcome',
    context: {},
    ...overrides,
  };
}

function baseConfig(overrides: Partial<EmailRuntimeConfig> = {}): EmailRuntimeConfig {
  return {
    provider: 'smtp',
    routingMode: 'single',
    categoryProviderMap: {},
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromName: 'workspace',
    fromAddress: 'noreply@workspace.example',
    verifyTransporter: false,
    ...overrides,
  };
}

describe('EmailProviderRouter', () => {
  let smtp: MockProvider;
  let resend: MockProvider;
  let mailgun: MockProvider;
  let mailtrap: MockProvider;
  let logger: ReturnType<typeof createMock<Pick<LoggerPort, 'warn'>>>;

  beforeEach(() => {
    smtp = createMock<Pick<EmailProviderPort, 'sendEmail' | 'verifyConnection'>>(['sendEmail', 'verifyConnection']);
    resend = createMock<Pick<EmailProviderPort, 'sendEmail' | 'verifyConnection'>>([
      'sendEmail',
      'verifyConnection',
    ]);
    mailgun = createMock<Pick<EmailProviderPort, 'sendEmail' | 'verifyConnection'>>([
      'sendEmail',
      'verifyConnection',
    ]);
    mailtrap = createMock<Pick<EmailProviderPort, 'sendEmail' | 'verifyConnection'>>([
      'sendEmail',
      'verifyConnection',
    ]);
    logger = createMock<Pick<LoggerPort, 'warn'>>(['warn']);
  });

  function makeRouter(cfg: EmailRuntimeConfig): EmailProviderRouter {
    return new EmailProviderRouter(
      cfg,
      smtp as unknown as SmtpEmailService,
      resend as unknown as ResendEmailService,
      mailgun as unknown as MailgunEmailService,
      mailtrap as unknown as MailtrapEmailService,
      logger as unknown as LoggerPort,
    );
  }

  it('always uses the configured provider in single mode, regardless of template/category', async () => {
    const router = makeRouter(baseConfig({ provider: 'mailtrap', routingMode: 'single' }));
    const job = baseJob({ template: 'password-reset', category: EmailCategory.MARKETING });

    await router.sendEmail(job);

    expect(mailtrap.sendEmail).toHaveBeenCalledWith(job);
    expect(smtp.sendEmail).not.toHaveBeenCalled();
    expect(resend.sendEmail).not.toHaveBeenCalled();
    expect(mailgun.sendEmail).not.toHaveBeenCalled();
  });

  it('derives the category from the template when no explicit category is set', async () => {
    const router = makeRouter(
      baseConfig({
        routingMode: 'category',
        categoryProviderMap: { [EmailCategory.SECURITY]: 'resend' },
      }),
    );
    const job = baseJob({ template: 'password-reset' });

    await router.sendEmail(job);

    expect(resend.sendEmail).toHaveBeenCalledWith(job);
    expect(smtp.sendEmail).not.toHaveBeenCalled();
  });

  it('lets an explicit category override win over the template-derived category', async () => {
    const router = makeRouter(
      baseConfig({
        routingMode: 'category',
        categoryProviderMap: {
          [EmailCategory.PAYMENTS]: 'resend',
          [EmailCategory.DEFAULT]: 'smtp',
        },
      }),
    );
    // 'user-welcome' derives to DEFAULT, but the explicit override should win.
    const job = baseJob({ template: 'user-welcome', category: EmailCategory.PAYMENTS });

    await router.sendEmail(job);

    expect(resend.sendEmail).toHaveBeenCalledWith(job);
    expect(smtp.sendEmail).not.toHaveBeenCalled();
  });

  it('falls back to the DEFAULT category provider when the resolved category has no mapping', async () => {
    const router = makeRouter(
      baseConfig({
        routingMode: 'category',
        categoryProviderMap: { [EmailCategory.DEFAULT]: 'mailgun' },
      }),
    );
    const job = baseJob({ template: 'password-reset' }); // SECURITY, unmapped

    await router.sendEmail(job);

    expect(mailgun.sendEmail).toHaveBeenCalledWith(job);
  });

  it('falls back to the single provider when neither the category nor DEFAULT is mapped', async () => {
    const router = makeRouter(
      baseConfig({ provider: 'smtp', routingMode: 'category', categoryProviderMap: {} }),
    );
    const job = baseJob({ template: 'password-reset' });

    await router.sendEmail(job);

    expect(smtp.sendEmail).toHaveBeenCalledWith(job);
  });

  it('falls back to DEFAULT and logs a warning for an unrecognized category value', async () => {
    const router = makeRouter(
      baseConfig({
        routingMode: 'category',
        categoryProviderMap: { [EmailCategory.DEFAULT]: 'mailgun' },
      }),
    );
    const job = baseJob({ category: 'not-a-real-category' as EmailCategory });

    await router.sendEmail(job);

    expect(mailgun.sendEmail).toHaveBeenCalledWith(job);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('delegates verifyConnection to the single-mode provider', async () => {
    const router = makeRouter(baseConfig({ provider: 'mailtrap' }));
    mailtrap.verifyConnection.mockResolvedValue(true);

    const result = await router.verifyConnection();

    expect(result).toBe(true);
    expect(mailtrap.verifyConnection).toHaveBeenCalled();
  });
});
