import { Injectable } from '@nestjs/common';
import { EventSubscription } from '@workspace/types';

/**
 * EventSubscriptionRegistry
 *
 * Collects EventSubscription declarations from all modules.
 * This is the ONLY place subscriptions are aggregated — and crucially,
 * it is never hand-edited. Modules call register() in their own
 * WorkerModule provider factory. The registry is then injected into
 * RoutingCompiler to produce the final routing table.
 *
 * Lifecycle:
 *   Module bootstrap → each WorkerModule registers its subscriptions
 *   → RoutingCompiler reads the registry → produces CompiledRoutingTable
 *   → DomainEventDispatchService injects the table → dispatches events
 *
 * This class is provided as a singleton at the app level (WorkersModule),
 * NOT inside EventsProcessingModule — because subscriptions are owned
 * by domain modules, not the events infrastructure.
 */
@Injectable()
export class EventSubscriptionRegistry {
  private readonly subscriptions: EventSubscription[] = [];

  /**
   * Register a subscription. Called from each domain's WorkerModule.
   *
   * Returns `this` for chaining if needed, but the typical usage is
   * a NestJS provider factory calling register() as a side effect.
   */
  register(subscription: EventSubscription): this {
    const duplicate = this.subscriptions.find((s) => s.name === subscription.name);
    if (duplicate) {
      throw new Error(
        `Duplicate event subscription name: "${subscription.name}". ` +
          `Each subscription must have a unique name.`,
      );
    }
    this.subscriptions.push(subscription);
    return this;
  }

  /**
   * Register multiple subscriptions at once.
   * Useful for modules that declare several independent subscriptions.
   */
  registerMany(subscriptions: EventSubscription[]): this {
    for (const sub of subscriptions) {
      this.register(sub);
    }
    return this;
  }

  getAll(): ReadonlyArray<EventSubscription> {
    return this.subscriptions;
  }

  /**
   * Returns all unique event patterns declared across all subscriptions.
   * Used by RoutingCompiler and coverage validator.
   */
  getAllPatterns(): string[] {
    return [...new Set(this.subscriptions.flatMap((s) => s.eventPatterns))];
  }

  /**
   * Returns all subscriptions interested in a given event type.
   * Useful for debugging and coverage reporting.
   */
  getSubscribersFor(eventType: string): EventSubscription[] {
    return this.subscriptions.filter((s) =>
      s.eventPatterns.some(
        (p) =>
          p === '*' ||
          p === eventType ||
          (p.endsWith('.*') && eventType.startsWith(p.slice(0, -2))),
      ),
    );
  }
}
