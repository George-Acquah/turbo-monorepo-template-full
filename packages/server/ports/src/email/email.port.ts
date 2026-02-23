import { EmailJobData } from '@repo/types';

/**
 * Email Port Interface
 *
 * This defines the contract that all email providers must implement.
 * Consumers depend on this abstraction, not concrete implementations.
 */
export abstract class EmailPort {
  /**
   * Send an email
   * @param emailData - Email data without template
   * @returns Message ID or undefined
   */
  abstract sendEmail(emailData: Omit<EmailJobData, 'template'>): Promise<string | undefined>;
}

export const EMAIL_TOKEN = Symbol('EMAIL_TOKEN');
export const EMAIL_SMTP_TOKEN = Symbol('EMAIL_SMTP_TOKEN');
export const EMAIL_SES_TOKEN = Symbol('EMAIL_SES_TOKEN');
export const EMAIL_SENDGRID_TOKEN = Symbol('EMAIL_SENDGRID_TOKEN');
