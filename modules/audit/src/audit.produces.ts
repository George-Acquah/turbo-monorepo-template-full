import type { EventType } from '@workspace/types';

/**
 * Events the audit module PRODUCES. Empty today — audit only reacts (see
 * `audit.subscriptions.ts`'s `'workspace.*'` catch-all). Enforced by the
 * `workspace/event-ownership` ESLint rule: any future `publisher.publish(...)`
 * call in this module must reference an event added here first.
 */
export const auditProduces: EventType[] = [];
