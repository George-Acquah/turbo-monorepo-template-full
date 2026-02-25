import type { Job } from 'bullmq';
import { QueueProcessor } from './queue-processor.base';

/**
 * Minimal domain event envelope shape.
 * Your @repo/types DomainEvent is compatible with this shape.
 */
export type DomainEventEnvelope<TPayload = unknown> = {
  eventId: string;
  eventType: string;
  aggregateType?: string;
  aggregateId?: string;
  payload?: TPayload;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    tenantId?: string;
    [k: string]: unknown;
  };
};

export abstract class DomainEventHandler {
  abstract supports(eventType: string): boolean;
  abstract handle(event: DomainEventEnvelope<unknown>): Promise<void>;
}

/**
 * Base processor for queues that contain DomainEvent envelopes and use handler arrays.
 *
 * This base intentionally does NOT depend on your ports package.
 * If you want idempotency, override begin/complete/fail hooks or wrap handleEvent.
 */
export abstract class DomainEventQueueProcessor extends QueueProcessor<
  DomainEventEnvelope<unknown>
> {
  protected abstract readonly handlers: DomainEventHandler[];

  /**
   * Override this per module (e.g. QueueNames.NOTIFICATION_EVENTS).
   * Used for consistent idempotency scope and logging context if needed.
   */
  protected abstract readonly scope: string;

  protected async handle(job: Job<DomainEventEnvelope<unknown>>): Promise<void> {
    const event = job.data;

    const decision = await this.begin(event);
    if (decision === 'SKIP') {
      return;
    }

    try {
      const handler = this.handlers.find((h) => h.supports(event.eventType));

      if (!handler) {
        await this.onNoHandler(event);
        await this.complete(event);
        return;
      }

      await handler.handle(event);

      await this.complete(event);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      await this.fail(event, error);
      throw err;
    }
  }

  /**
   * Idempotency hooks (optional). Default: always execute.
   * Override in your app processors to call IdempotencyPort.
   */
  protected async begin(_event: DomainEventEnvelope): Promise<'EXECUTE' | 'SKIP'> {
    return 'EXECUTE';
  }

  protected async complete(_event: DomainEventEnvelope): Promise<void> {
    return;
  }

  protected async fail(_event: DomainEventEnvelope, _error: Error): Promise<void> {
    return;
  }

  protected async onNoHandler(_event: DomainEventEnvelope): Promise<void> {
    return;
  }
}
