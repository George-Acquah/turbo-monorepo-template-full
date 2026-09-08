import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventSubscriptionRegistry } from './subscription.registry';

/**
 * EventCoverageValidator
 *
 * Runs at application bootstrap and logs a warning for any known event
 * type that has no subscriber. Optionally throws in non-production
 * environments to catch missing subscriptions in CI.
 *
 * This is an OPTIONAL but strongly recommended component.
 * Add it to EventsRoutingModule providers to activate it.
 *
 * Usage: inject the registry and a list of all known event type strings.
 * The known events list can be assembled from your constants package:
 *
 *   const ALL_KNOWN_EVENTS = [
 *     ...Object.values(AuthEvents),
 *     ...Object.values(PaymentEvents),
 *     ...Object.values(ReminderEvents),
 *     // etc.
 *   ];
 *
 * This list lives in the events package or a dedicated coverage config —
 * it is the ONE place that references all event constants, and its sole
 * purpose is validation, not routing.
 */
@Injectable()
export class EventCoverageValidator implements OnApplicationBootstrap {
  private readonly logger = new Logger(EventCoverageValidator.name);

  constructor(
    private readonly registry: EventSubscriptionRegistry,
    private readonly knownEventTypes: string[],
    private readonly options: { throwOnMissing?: boolean } = {},
  ) {}

  onApplicationBootstrap(): void {
    const uncovered: string[] = [];

    for (const eventType of this.knownEventTypes) {
      const subscribers = this.registry.getSubscribersFor(eventType);
      if (subscribers.length === 0) {
        uncovered.push(eventType);
      }
    }

    if (uncovered.length === 0) {
      this.logger.log(
        `Event coverage: all ${this.knownEventTypes.length} known event types have at least one subscriber.`,
      );
      return;
    }

    const message =
      `Event coverage warning: ${uncovered.length} event type(s) have no subscriber:\n` +
      uncovered.map((e) => `  - ${e}`).join('\n') +
      `\nThese events will be routed to no queue and silently dropped.`;

    if (this.options.throwOnMissing) {
      throw new Error(message);
    } else {
      this.logger.warn(message);
    }
  }
}
