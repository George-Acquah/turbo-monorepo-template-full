import type { Job, JobsOptions } from 'bullmq';
import { QueueProcessor } from './queue-processor.base';
import type { DomainEventEnvelope } from './domain-event-queue-processor.base';
import { QueueBusPort, PartitionStrategyPort } from '@repo/ports';
import { PartitionContext } from '@repo/types';
import { JobNames } from '@repo/constants';

/**
 * Route map: supports exact matches and wildcard prefix matches ('auth.*').
 */
export type EventRouteMap = Record<string, string[]>;

type CompiledWildcard = { prefix: string; queues: string[] };

export abstract class RouterQueueProcessor extends QueueProcessor<DomainEventEnvelope<unknown>> {
  protected abstract readonly bus: QueueBusPort;
  protected abstract readonly partitioning?: PartitionStrategyPort;

  protected abstract readonly routeMap: EventRouteMap;

  private compiledWildcards: CompiledWildcard[] | null = null;

  protected async handle(job: Job<DomainEventEnvelope<unknown>>): Promise<void> {
    const event = job.data;

    const targets = this.resolveTargets(event.eventType);
    if (targets.length === 0) {
      await this.onNoRoutes(event);
      return;
    }

    await this.fanout(event, targets);
  }

  protected async fanout(event: DomainEventEnvelope<unknown>, queues: string[]): Promise<void> {
    // Default: fire them all concurrently
    await Promise.all(queues.map((queueName) => this.routeToQueue(queueName, event)));
  }

  protected async routeToQueue(
    queueName: string,
    event: DomainEventEnvelope<unknown>,
  ): Promise<void> {
    const jobName = this.getJobNameForTarget(queueName, event);

    // Partitioning optional
    if (this.partitioning && this.partitioning.isPartitioned(queueName)) {
      // policy: some queues may “consume from base” even if partitioning is enabled
      if (this.partitioning.consumeFromBaseQueue(queueName)) {
        await this.bus.enqueue(queueName, jobName, event, this.getJobOptions(queueName, event));
        return;
      }

      const ctx = this.getPartitionContext(queueName, event);
      const key = this.partitioning.getPartitionKey(queueName, ctx);

      await this.bus.enqueuePartitioned(
        queueName,
        key,
        jobName,
        event,
        this.getJobOptions(queueName, event, key),
      );
      return;
    }

    await this.bus.enqueue(queueName, jobName, event, this.getJobOptions(queueName, event));
  }

  protected getPartitionContext(_queueName: string, event: DomainEventEnvelope): PartitionContext {
    return {
      tenantId: (event.metadata?.tenantId as string | undefined) ?? undefined,
      userId: (event.metadata?.userId as string | undefined) ?? undefined,
      key: event.aggregateId ?? undefined,
    };
  }

  protected getJobNameForTarget(_queueName: string, _event: DomainEventEnvelope): string {
    // Your reference uses JobNames.PROCESS_DOMAIN_EVENT
    return JobNames.PROCESS_DOMAIN_EVENT;
  }

  protected getJobOptions(
    _queueName: string,
    event: DomainEventEnvelope,
    partitionKey?: string,
  ): JobsOptions {
    // Default: dedupe by eventId, and keep stable across replays
    const baseId = event.eventId;
    const jobId = partitionKey
      ? `${_queueName}-${partitionKey}-${baseId}`
      : `${_queueName}-${baseId}`;
    return { jobId };
  }

  protected resolveTargets(eventType: string): string[] {
    const exact = this.routeMap[eventType];
    if (exact) return exact;

    const wildcards = this.getCompiledWildcards();
    for (const w of wildcards) {
      if (eventType.startsWith(w.prefix)) return w.queues;
    }
    return [];
  }

  protected async onNoRoutes(_event: DomainEventEnvelope): Promise<void> {
    return;
  }

  private getCompiledWildcards(): CompiledWildcard[] {
    if (this.compiledWildcards) return this.compiledWildcards;

    const compiled: CompiledWildcard[] = [];
    for (const [pattern, queues] of Object.entries(this.routeMap)) {
      if (!pattern.endsWith('*')) continue;
      compiled.push({ prefix: pattern.slice(0, -1), queues });
    }

    // Sort by longest prefix first (most specific wins)
    compiled.sort((a, b) => b.prefix.length - a.prefix.length);

    this.compiledWildcards = compiled;
    return compiled;
  }
}
