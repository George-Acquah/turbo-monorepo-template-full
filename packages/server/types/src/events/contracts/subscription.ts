import type { EventType } from '../domain-events.constants';

/**
 * EVENT SUBSCRIPTION SYSTEM — CORE TYPES
 *
 * Design principle: consumers own their subscriptions.
 * Consumers declare intent by pattern; producers declare identity by
 * following a naming convention. The compiler derives the routing table
 * at boot time from the intersection.
 *
 * Coupling rules enforced by this design:
 *   ✅ Consumer imports only its own domain's QueueNames constant
 *   ✅ Producer emits events; has zero knowledge of consumers
 *   ✅ Central routing table is derived, never hand-authored
 *   ✅ An exact-match pattern references the real event constant (e.g.
 *      `ProfilesEvents.ERASURE_REQUESTED`), not a hand-typed string — every
 *      `{Context}Events` object lives centrally in this same package
 *      (`domain-events.constants.ts`), so this isn't a foreign-module
 *      import, it's referencing the shared vocabulary. It buys real
 *      rename-safety: if the catalog value ever changes, the reference
 *      fails to compile instead of silently going stale.
 *   ❌ Don't hand-enumerate a foreign domain's events
 *      (`Object.values(ForeignEvents)`) where a `'foreign-domain.*'`
 *      wildcard would do — a newly-added event in that domain wouldn't
 *      automatically be included in a hand-enumerated list.
 */

/**
 * A single consumer's subscription declaration.
 *
 * eventPatterns supports:
 *   - Exact match:   'auth.user.created'
 *   - Prefix:        'auth.*'
 *   - Global catch:  '*'  (use sparingly — audit is the canonical use case)
 *
 * Modules declare these in their own constants file and register them
 * in their own WorkerModule via EventSubscriptionRegistry.register().
 * No central file owns all subscriptions.
 */
export interface EventSubscription {
  /**
   * Human-readable name for this subscription.
   * Used in startup logs, coverage reports, and error messages.
   * Conventionally: '<domain>.<purpose>' e.g. 'notifications.delivery'
   */
  readonly name: string;

  /**
   * Pattern(s) this consumer wants to receive.
   * Uses the same prefix convention as event type strings:
   *   domain.aggregate.action
   *
   * An exact match MUST be a real, current catalog member — reference the
   * constant: `ProfilesEvents.ERASURE_REQUESTED`, not the literal string.
   * TypeScript then catches a renamed/removed event at compile time instead
   * of the subscription silently going stale.
   *
   * A consumer that wants all of one domain's events: ['workspace.billing.*']
   * A consumer that wants one specific event: [AuthEvents.USER_REGISTERED]
   * A consumer that wants everything: ['*']
   *
   * Don't hand-enumerate a foreign domain's events one by one where a
   * wildcard would do — a newly-added event wouldn't be included.
   */
  readonly eventPatterns: readonly (EventType | `${string}.*` | '*')[];

  /**
   * Queue(s) this subscription delivers to.
   * Fanout is supported: one event, multiple queues.
   */
  readonly queues: readonly string[];

  /**
   * Optional: delivery priority hint for the job options layer.
   * Processors can use this to set BullMQ job priority.
   */
  readonly priority?: 'critical' | 'standard' | 'background';
}

/**
 * Compiled routing entry — output of RoutingCompiler.
 * This is what RouterQueueProcessor actually operates on.
 */
export interface CompiledRoute {
  readonly queues: string[];
  readonly priority?: EventSubscription['priority'];
}

/**
 * The compiled routing table: eventType → delivery targets.
 * Wildcards are pre-expanded during compilation, not at dispatch time.
 */
export type CompiledRoutingTable = Map<string, CompiledRoute>;

/**
 * Token for injecting the compiled routing table into processors.
 */
export const ROUTING_TABLE_TOKEN = Symbol('ROUTING_TABLE_TOKEN');

/**
 * Token for injecting the subscription registry.
 */
export const EVENT_SUBSCRIPTION_REGISTRY_TOKEN = Symbol('EVENT_SUBSCRIPTION_REGISTRY_TOKEN');
