import { describe, it, expect } from '@jest/globals';
import type { EventSubscription } from '@workspace/types';
import { RoutingCompiler } from '../src/mesh/routing.compiler';
import { EventSubscriptionRegistry } from '../src/mesh/subscription.registry';

/**
 * These cover the invariant that made removing `eventsSubscription` safe.
 *
 * It used to claim 'workspace.*' → [DOMAIN_EVENTS, DEAD_LETTER]: DOMAIN_EVENTS
 * is the queue being drained (so every unrouted event re-entered its own
 * dispatcher) and DEAD_LETTER had no consumer (so every unrouted event parked
 * a BullMQ job in Redis permanently). Dropping it is only non-lossy because
 * audit's subscription claims the SAME pattern and the compiler unions
 * same-pattern queue sets rather than letting one win — that union is what is
 * asserted here.
 *
 * Deliberately built from inline subscriptions rather than importing
 * @workspace/audit: this package must not depend on a bounded-context module,
 * and the behaviour under test belongs to the compiler either way.
 */
function compile(subscriptions: EventSubscription[]) {
  const registry = new EventSubscriptionRegistry();
  registry.registerMany(subscriptions);
  return new RoutingCompiler().compile(registry);
}

const auditLike: EventSubscription = {
  name: 'audit.reactions',
  eventPatterns: ['workspace.*'],
  queues: ['workspace.audit.events'],
  priority: 'background',
};

describe('RoutingCompiler', () => {
  it('unions queues across subscriptions sharing a pattern', () => {
    const table = compile([
      auditLike,
      {
        name: 'other.reactions',
        eventPatterns: ['workspace.*'],
        queues: ['workspace.other.events'],
        priority: 'standard',
      },
    ]);

    expect(table.get('workspace.*')?.queues).toEqual(
      expect.arrayContaining(['workspace.audit.events', 'workspace.other.events']),
    );
  });

  it('leaves audit as the sole catch-all once it is the only wildcard subscriber', () => {
    const table = compile([
      auditLike,
      {
        name: 'billing.reactions',
        eventPatterns: ['workspace.billing.payment.verified'],
        queues: ['workspace.billing.events'],
        priority: 'critical',
      },
    ]);

    const wildcard = table.get('workspace.*');
    expect(wildcard?.queues).toEqual(['workspace.audit.events']);
    // The two failure modes this whole change exists to remove.
    expect(wildcard?.queues).not.toContain('workspace.events.domain');
    expect(wildcard?.queues).not.toContain('workspace.events.dlq');
  });

  it('keeps an exact subscription separate from the wildcard', () => {
    const table = compile([
      auditLike,
      {
        name: 'billing.reactions',
        eventPatterns: ['workspace.billing.payment.verified'],
        queues: ['workspace.billing.events'],
        priority: 'critical',
      },
    ]);

    expect(table.get('workspace.billing.payment.verified')?.queues).toEqual([
      'workspace.billing.events',
    ]);
  });

  it('escalates a merged route to the highest priority among its mergers', () => {
    const table = compile([
      auditLike,
      {
        name: 'critical.reactions',
        eventPatterns: ['workspace.*'],
        queues: ['workspace.critical.events'],
        priority: 'critical',
      },
    ]);

    // audit's 'background' must not drag a co-registered subscription down.
    expect(table.get('workspace.*')?.priority).toBe('critical');
  });
});
