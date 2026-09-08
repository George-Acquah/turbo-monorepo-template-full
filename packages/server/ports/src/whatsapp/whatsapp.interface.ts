export interface WhatsAppMessage {
  /** Recipient phone number in E.164 format, e.g. +233244123456 */
  to: string;
  /** Plain-text message body. Used when no templateSid is provided. */
  message: string;
  /**
   * Template identifier — Twilio Content SID (HXxxx) or Meta template name.
   * When set, the message is sent as an approved template (required for outbound
   * messages outside the 24-hour customer care window).
   */
  templateSid?: string;
  /**
   * Template variable substitutions keyed by 1-indexed string positions,
   * e.g. { "1": "Daniel", "2": "GHS 250.00" }.
   * Only used when templateSid is set.
   */
  templateVariables?: Record<string, string>;
  /** Optional internal correlation id for logging / idempotency. */
  notificationId?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  /** Provider message ID (Twilio SID or Meta wamid). */
  messageSid?: string;
  messageResponse?: Record<string, unknown>;
  error?: string;
}
