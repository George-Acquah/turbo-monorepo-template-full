// packages/server/events/src/mesh/dispatch.engine.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ROUTING_TABLE_TOKEN,
  type CompiledRoute,
  type CompiledRoutingTable,
} from '@workspace/types';
import { DomainEventEnvelope } from '@workspace/queue';

import { DispatchTarget } from '@/mesh';
import { BindingRegistry } from './binding.registry';

@Injectable()
export class DispatchEngine {
  private readonly logger = new Logger(DispatchEngine.name);
  private readonly routeCache = new Map<string, CompiledRoute | null>();
  private prefixIndex: Array<{ prefix: string; pattern: string }> | null = null;
  private bindingsValidated = false;

  constructor(
    @Inject(ROUTING_TABLE_TOKEN)
    private readonly routingTable: CompiledRoutingTable,
    private readonly bindingRegistry: BindingRegistry,
  ) {}

  validateBindings(): void {
    const missing = new Set<string>();

    for (const route of this.routingTable.values()) {
      for (const queue of route.queues) {
        if (!this.bindingRegistry.has(queue)) {
          missing.add(queue);
        }
      }
    }

    if (missing.size > 0) {
      throw new Error(`Missing transport bindings: ${[...missing].join(', ')}`);
    }

    this.bindingsValidated = true;
  }

  async dispatch(event: DomainEventEnvelope<unknown>): Promise<void> {
    this.ensureBindingsValidated();

    const route = this.resolveRoute(event.eventType);

    if (!route) {
      this.logger.warn(
        `No subscription found for event type: "${event.eventType}". Event will not be delivered.`,
      );
      return;
    }

    const targets: DispatchTarget[] = route.queues.map((queueName) => ({
      queueName,
      route,
    }));

    const grouped = new Map<unknown, DispatchTarget[]>();

    for (const target of targets) {
      const adapter = this.bindingRegistry.get(target.queueName);
      const existing = grouped.get(adapter);
      if (existing) {
        existing.push(target);
      } else {
        grouped.set(adapter, [target]);
      }
    }

    const results = await Promise.allSettled(
      [...grouped.entries()].map(([adapter, adapterTargets]) =>
        (
          adapter as {
            dispatchMany: (
              targets: DispatchTarget[],
              event: DomainEventEnvelope<unknown>,
            ) => Promise<void>;
          }
        ).dispatchMany(adapterTargets, event),
      ),
    );

    const failures = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result) =>
        result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
      );

    if (failures.length > 0) {
      throw new AggregateError(failures, `Failed dispatching event ${event.eventId}`);
    }
  }

  private ensureBindingsValidated(): void {
    if (!this.bindingsValidated) {
      this.validateBindings();
    }
  }

  private resolveRoute(eventType: string): CompiledRoute | null {
    const cached = this.routeCache.get(eventType);
    if (cached !== undefined) return cached;

    const route = this.computeRoute(eventType);
    this.routeCache.set(eventType, route);
    return route;
  }

  private computeRoute(eventType: string): CompiledRoute | null {
    const exact = this.routingTable.get(eventType);
    if (exact) return exact;

    const index = this.getPrefixIndex();
    for (const { prefix, pattern } of index) {
      if (eventType.startsWith(prefix)) {
        return this.routingTable.get(pattern) ?? null;
      }
    }

    return this.routingTable.get('*') ?? null;
  }

  private getPrefixIndex(): Array<{ prefix: string; pattern: string }> {
    if (this.prefixIndex) return this.prefixIndex;

    const entries: Array<{ prefix: string; pattern: string }> = [];

    for (const pattern of this.routingTable.keys()) {
      if (pattern === '*') continue;
      if (pattern.endsWith('.*')) {
        entries.push({ prefix: pattern.slice(0, -1), pattern });
      }
    }

    entries.sort((a, b) => b.prefix.length - a.prefix.length);
    this.prefixIndex = entries;

    return this.prefixIndex;
  }
}
