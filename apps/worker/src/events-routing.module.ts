import { Global, Module } from '@nestjs/common';

import { auditSubscriptions } from '@workspace/audit';
import { authSubscriptions } from '@workspace/auth';
import { notificationsSubscriptions } from '@workspace/notifications';
import { profilesSubscriptions } from '@workspace/profiles';
import {
  AllEvents,
  EVENT_SUBSCRIPTION_REGISTRY_TOKEN,
  ROUTING_TABLE_TOKEN,
} from '@workspace/types';
import {
  RoutingCompiler,
  EventSubscriptionRegistry,
  EventCoverageValidator,
} from '@workspace/events';

/**
 * EventsRoutingModule
 *
 * NOT imported by apps/api's AppModule, and shouldn't be. Producing an
 * event (EventPublisherService.publish, appending an outbox row inside a
 * Postgres transaction) needs only TRANSACTION_PORT_TOKEN +
 * OUTBOX_EVENT_REPOSITORY_TOKEN — see @workspace/events' EventsModule,
 * which apps/api imports instead. ROUTING_TABLE_TOKEN (built here) is only
 * consumed by DispatchEngine and EventsProcessingModule.onModuleInit, both
 * reached exclusively through a BullMQ job handler (DomainEventDispatchService) —
 * i.e. compiling and consulting the routing table is what a background
 * worker does when draining the outbox and fanning events out to
 * per-consumer queues, not something the API needs to produce an event.
 * Assembles the subscription registry and compiles the routing table.
 * Imported by WorkersModule — not by EventsProcessingModule directly.
 * @Global() is required here: EventsProcessingModule (nested inside
 * EventsWorkersModule) injects ROUTING_TABLE_TOKEN via plain constructor
 * @Inject(), and NestJS does not share providers between sibling module
 * imports of the same parent unless one of them is global.
 *
 * To add a new domain's subscriptions:
 *   1. Create a subscription constant in that domain's package
 *   2. Export it from the package's index.ts
 *   3. Add it to the registry.registerMany() call below
 *   That's the only change required. No central map. No routing file edits.
 */
@Global()
@Module({
  providers: [
    {
      provide: EventCoverageValidator,
      useFactory: (registry: EventSubscriptionRegistry) => {
        const ALL_KNOWN_EVENTS = Object.values(AllEvents);
        const options = {
          throwOnMissing: true,
        };

        return new EventCoverageValidator(registry, ALL_KNOWN_EVENTS, options);
      },
      inject: [EVENT_SUBSCRIPTION_REGISTRY_TOKEN],
    },
    // Step 1: build the registry from all domain subscriptions
    {
      provide: EVENT_SUBSCRIPTION_REGISTRY_TOKEN,
      useFactory: (): EventSubscriptionRegistry => {
        const registry = new EventSubscriptionRegistry();
        registry.registerMany([
          // NOTE: @workspace/events' `eventsSubscription` used to head this
          // list, claiming 'workspace.*' → [DOMAIN_EVENTS, DEAD_LETTER]. Both
          // targets were wrong: DOMAIN_EVENTS is the queue being drained (a
          // self-loop, terminated only by the COMPLETED idempotency key after
          // a wasted job), and DEAD_LETTER had no consumer, so every event
          // without an exact subscription parked a job in Redis forever.
          // `auditSubscriptions` claims the same 'workspace.*' pattern and
          // RoutingCompiler unions same-pattern queue sets, so the catch-all
          // still reaches audit — nothing lost by dropping it.
          authSubscriptions,
          notificationsSubscriptions,
          auditSubscriptions,
          profilesSubscriptions,
        ]);
        return registry;
      },
    },

    // Step 2: compile the registry into a routing table
    {
      provide: ROUTING_TABLE_TOKEN,
      useFactory: (
        registry: EventSubscriptionRegistry,
        compiler: RoutingCompiler,
      ) => compiler.compile(registry),
      inject: [EVENT_SUBSCRIPTION_REGISTRY_TOKEN, RoutingCompiler],
    },

    RoutingCompiler,
  ],
  exports: [ROUTING_TABLE_TOKEN, EVENT_SUBSCRIPTION_REGISTRY_TOKEN],
})
export class EventsRoutingModule {}
