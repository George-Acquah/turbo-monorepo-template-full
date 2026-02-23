/**
 * Email Type Definitions
 */

export enum EmailTemplate {
  WELCOME = 'welcome',
  INVITATION = 'invitation',
  PASSWORD_RESET = 'password-reset',
  PAYMENT_RECEIPT = 'payment-receipt',
}

export enum EmailPriority {
  HIGH = 1,
  NORMAL = 5,
  LOW = 10,
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface BaseEmailData {
  to: EmailAddress | EmailAddress[];
  subject: string;
  template: EmailTemplate;
  provider?: 'smtp' | 'ses' | 'sendgrid' | string;
  context: Record<string, unknown>;
  from?: EmailAddress;
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  attachments?: EmailAttachment[];
  priority?: EmailPriority;
  body?: string;
  htmlBody?: string;
  metadata?: Record<string, unknown>;
  // Optional correlation to a notification record
  notificationId?: string;
}

export interface EmailJobData extends BaseEmailData {
  attemptNumber?: number;
  lastError?: string;
}
