import { Injectable, Logger } from '@nestjs/common';
import { CompiledRoutingTable, EventSubscription } from '@workspace/types';
import { EventSubscriptionRegistry } from './subscription.registry';

/**
 * RoutingCompiler
 *
 * Derives a CompiledRoutingTable from the EventSubscriptionRegistry.
 * Called once at application bootstrap — never at dispatch time.
 *
 * Compilation strategy:
 *   Wildcard patterns ('auth.*', 'reminder.*') are NOT pre-expanded here
 *   because we don't have a static list of all possible event types at
 *   compile time. Instead, wildcards are stored as-is and the lookup in
 *   RouterQueueProcessor resolves them at dispatch time using a fast
 *   prefix index. This is O(n patterns) per dispatch, not O(all events).
 *
 * The compiled table structure:
 *   Map {
 *     'auth.user.created'  → { queues: ['user-events'], priority: 'standard' }
 *     'auth.*'             → { queues: ['user-events'], priority: 'standard' }
 *     'payment.*'          → { queues: ['payment-events'], priority: 'critical' }
 *     '*'                  → { queues: ['audit-events'], priority: 'background' }
 *   }
 *
 * Fanout: if two subscriptions both match 'payment.*', their queues are merged:
 *   Map { 'payment.*' → { queues: ['payment-events', 'audit-events'] } }
 *
 * Priority: highest priority among all matching subscriptions wins per entry.
 */
@Injectable()
export class RoutingCompiler {
  private readonly logger = new Logger(RoutingCompiler.name);

  compile(registry: EventSubscriptionRegistry): CompiledRoutingTable {
    const table = new Map<
      string,
      { queues: Set<string>; priority?: EventSubscription['priority'] }
    >();

    for (const subscription of registry.getAll()) {
      for (const pattern of subscription.eventPatterns) {
        const existing = table.get(pattern);

        if (existing) {
          // Merge queues from multiple subscriptions matching the same pattern
          for (const q of subscription.queues) {
            existing.queues.add(q);
          }
          // Escalate priority if this subscription has a higher one
          existing.priority = higherPriority(existing.priority, subscription.priority);
        } else {
          table.set(pattern, {
            queues: new Set(subscription.queues),
            priority: subscription.priority,
          });
        }
      }
    }

    // Freeze into the final immutable shape
    const compiled: CompiledRoutingTable = new Map();
    for (const [pattern, { queues, priority }] of table) {
      compiled.set(pattern, { queues: [...queues], priority });
    }

    this.logSummary(compiled, registry);

    return compiled;
  }

  private logSummary(table: CompiledRoutingTable, registry: EventSubscriptionRegistry): void {
    const subscriptions = registry.getAll();
    this.logger.log(
      `Event routing compiled: ${subscriptions.length} subscription(s), ` +
        `${table.size} pattern(s) → ` +
        `${[...new Set([...table.values()].flatMap((r) => r.queues))].length} unique queue(s)`,
    );

    for (const [pattern, route] of table) {
      this.logger.debug(`  ${pattern} → [${route.queues.join(', ')}]`);
    }
  }
}

const PRIORITY_ORDER: Record<NonNullable<EventSubscription['priority']>, number> = {
  critical: 3,
  standard: 2,
  background: 1,
};

function higherPriority(
  a: EventSubscription['priority'],
  b: EventSubscription['priority'],
): EventSubscription['priority'] {
  if (!a) return b;
  if (!b) return a;
  return PRIORITY_ORDER[a] >= PRIORITY_ORDER[b] ? a : b;
}
