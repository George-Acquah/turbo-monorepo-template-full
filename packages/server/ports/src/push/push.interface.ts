export interface PushMessage {
  /** FCM registration token for the target device. */
  deviceToken: string;
  title: string;
  body: string;
  /** Optional structured payload delivered alongside the notification. */
  data?: Record<string, string>;
  /** Optional internal correlation id for logging / idempotency. */
  notificationId?: string;
}

export interface PushSendResult {
  success: boolean;
  /** Provider message ID (FCM message name). */
  messageId?: string;
  error?: string;
}
