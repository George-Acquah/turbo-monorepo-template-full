/**
 * SMS Job Data — mirrors email-event.types.ts's shape/conventions.
 */

import type { SmsTemplate } from '@workspace/constants';


export enum SmsPriority {
  HIGH = 1,
  NORMAL = 5,
  LOW = 10,
}

export interface BaseSmsData {
  deliveryId: string;
  to: string;
  template: SmsTemplate;
  context: Record<string, unknown>;
  priority?: SmsPriority;
  body?: string;
  metadata?: Record<string, unknown>;
  // Optional correlation to a notification record
  notificationId?: string;
}

export interface SmsJobData extends BaseSmsData {
  attemptNumber?: number;
  lastError?: string;
}
