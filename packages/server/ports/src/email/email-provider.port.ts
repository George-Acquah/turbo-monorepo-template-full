import { EmailPort } from './email.port';

/**
 * The richer contract concrete email providers implement — extends the
 * public EmailPort (sendEmail only) with verifyConnection/getProviderName,
 * needed internally by @workspace/email's delivery adapter and module
 * factory. Matches SmsProviderPort/PushProviderPort/WhatsAppProviderPort's
 * naming convention.
 */
export abstract class EmailProviderPort extends EmailPort {
  abstract verifyConnection(): Promise<boolean>;
  abstract getProviderName(): string;
}
