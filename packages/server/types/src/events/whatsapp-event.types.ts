/**
 * WhatsApp Job Data — mirrors email-event.types.ts's shape/conventions.
 * Wraps the existing WhatsAppProviderPort (packages/server/ports/src/whatsapp)
 * into the uniform deliveryId/notificationId job-data convention the other
 * channels use.
 */

import type { WhatsAppTemplate } from '@workspace/constants';


export enum WhatsAppPriority {
  HIGH = 1,
  NORMAL = 5,
  LOW = 10,
}

export interface BaseWhatsAppData {
  deliveryId: string;
  to: string;
  template: WhatsAppTemplate;
  context: Record<string, unknown>;
  priority?: WhatsAppPriority;
  body?: string;
  metadata?: Record<string, unknown>;
  // Optional correlation to a notification record
  notificationId?: string;
}

export interface WhatsAppJobData extends BaseWhatsAppData {
  attemptNumber?: number;
  lastError?: string;
}
