import type { EventType } from '@workspace/types';

/**
 * Events the notifications module PRODUCES. Empty today — notifications is
 * worker-only, it only reacts (see `notifications.subscriptions.ts`).
 * Enforced by the `workspace/event-ownership` ESLint rule: any future
 * `publisher.publish(...)` call in this module must reference an event added
 * here first.
 */
export const notificationsProduces: EventType[] = [];
