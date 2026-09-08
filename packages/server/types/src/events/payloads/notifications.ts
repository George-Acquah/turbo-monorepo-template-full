import { NotificationsEvents } from '../domain-events.constants';

// Delivery feedback from the ESP (bounce/complaint) → suppression list. This is
// the only context that emits — notifications otherwise CONSUMES domain events
// and sends. `email` is required here (it's the suppression key).

export type EmailBounceType = 'HARD' | 'SOFT';

export interface EmailBouncedPayload {
  readonly email: string;
  readonly provider: string;
  readonly bounceType?: EmailBounceType;
  readonly notificationId?: string;
  readonly deliveryId?: string;
  readonly providerMessageId?: string;
  readonly bouncedAt: string;
}

export interface EmailComplainedPayload {
  readonly email: string;
  readonly provider: string;
  readonly notificationId?: string;
  readonly deliveryId?: string;
  readonly providerMessageId?: string;
  readonly complainedAt: string;
}

export interface NotificationsEventsMap {
  [NotificationsEvents.EMAIL_BOUNCED]: EmailBouncedPayload;
  [NotificationsEvents.EMAIL_COMPLAINED]: EmailComplainedPayload;
}
