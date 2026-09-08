import { QueueNames } from '@workspace/constants';
import type { EventSubscription } from '@workspace/types';

/**
 * Audit reacts to EVERY event. Deliberately `'workspace.*'`, NOT the bare
 * `'*'` global wildcard: `DispatchEngine.computeRoute()` resolves exactly
 * one route per event in priority order — exact match, then the longest
 * `.*` prefix match, and only as a last resort the bare `'*'` fallback.
 * Since every real event is already `workspace.*`-prefixed, a bare `'*'`
 * entry here would never be reached — permanently shadowed by any prefix
 * match, which always wins first.
 *
 * This is now the ONLY subscription claiming `'workspace.*'`, which makes it
 * the catch-all for every event type without an exact subscription of its
 * own. (It previously shared the pattern with `@workspace/events`'
 * `eventsSubscription`, whose queues — DOMAIN_EVENTS and DEAD_LETTER — were
 * a self-loop and an unconsumed sink respectively; that subscription is
 * gone. `RoutingCompiler` still unions same-pattern queue sets, so adding
 * another `'workspace.*'` subscription later merges into this route rather
 * than replacing it.)
 *
 * `priority: 'background'` — audit is compliance record-keeping, not
 * user-facing; it should never compete with real-time delivery for queue
 * priority (a merged route takes the highest priority among its mergers, so
 * this never downgrades a co-registered subscription).
 */
export const auditSubscriptions: EventSubscription = {
  name: 'audit.reactions',
  eventPatterns: ['workspace.*'],
  queues: [QueueNames.AUDIT_EVENTS],
  priority: 'background',
};
