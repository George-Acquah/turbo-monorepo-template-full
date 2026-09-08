/**
 * Email Type Definitions
 */

import type { EmailCategory, EmailTemplate } from '@workspace/constants';

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

export interface EmailBrandContext {
  companyName?: string;
  frontendUrl?: string;
  supportEmail?: string;
  logoUrl?: string;
  year?: number;
  [key: string]: unknown;
}

export interface BaseEmailData {
  deliveryId: string;
  to: EmailAddress | EmailAddress[];
  subject: string;
  template: EmailTemplate;
  provider?: 'smtp' | 'ses' | 'resend' | 'mailgun' | string;
  /** Explicit routing-category override; falls back to a template-derived category when unset. */
  category?: EmailCategory;
  context: Record<string, unknown> & Partial<EmailBrandContext>;
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
