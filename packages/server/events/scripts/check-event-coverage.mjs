#!/usr/bin/env node
/**
 * @fileoverview Headless event-coverage check.
 *
 * `EventCoverageValidator` (src/mesh/events-coverage.validator.ts) already does this comparison,
 * but only at Nest `onApplicationBootstrap` — i.e. only once a real process (with Redis/DB) actually
 * boots. This script runs the same comparison as a plain Node script, so a PR can fail on an orphan
 * event (a catalog entry with zero subscribers, "routed to no queue and silently dropped") before
 * merge instead of at deploy time.
 *
 * Modules are auto-discovered (see ./lib/discover-module-events.mjs) — no hand-maintained list to
 * keep in sync with apps/worker/src/events-routing.module.ts.
 *
 * Usage: node ./scripts/check-event-coverage.mjs
 * Requires every module package to be built first (pnpm --filter @workspace/{context} build).
 */

import { AllEvents } from '@workspace/types';
import { EventSubscriptionRegistry } from '@workspace/events';
import { discoverModuleEvents } from './lib/discover-module-events.mjs';

const modules = await discoverModuleEvents();

const registry = new EventSubscriptionRegistry();
// `eventsSubscription` (the transport-level outbox→domain-events 'workspace.*' wildcard) was
// removed from @workspace/events — see events/test/routing.compiler.spec.ts's header comment:
// dropping it is non-lossy because audit's subscription claims the same 'workspace.*' pattern and
// the routing compiler unions same-pattern queue sets. This script now mirrors the runtime
// registry (events-routing.module.ts) exactly, which also no longer registers it.
registry.registerMany(modules.map((m) => m.subscriptions).filter((s) => s !== null));

const allEventTypes = Object.values(AllEvents);
const uncovered = allEventTypes.filter(
  (eventType) => registry.getSubscribersFor(eventType).length === 0,
);

if (uncovered.length > 0) {
  console.error(
    `[check-event-coverage] ${uncovered.length} event type(s) have no subscriber ` +
      `(would be routed to no queue and silently dropped):`,
  );
  for (const eventType of uncovered) {
    console.error(`  - ${eventType}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `[check-event-coverage] OK — all ${allEventTypes.length} event types have at least one subscriber ` +
      `(${modules.length} module(s) discovered: ${modules.map((m) => m.context).join(', ')}).`,
  );
}
