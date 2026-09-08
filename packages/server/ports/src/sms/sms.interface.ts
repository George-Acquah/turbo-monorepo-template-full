export interface SmsMessage {
  /** Recipient phone number in E.164 format, e.g. +233244123456 */
  to: string;
  /** Plain-text message body. */
  message: string;
  /** Optional internal correlation id for logging / idempotency. */
  notificationId?: string;
}

export interface SmsSendResult {
  success: boolean;
  /** Provider message ID (Twilio SID). */
  messageSid?: string;
  error?: string;
}
