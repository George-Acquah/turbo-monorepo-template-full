import { AuditEntityType, PublishOptions } from '@repo/types';

export interface DomainEventInput<T = unknown> extends EventContext {
  eventType: string;
  aggregateType: AuditEntityType;
  aggregateId: string;
  payload: T;
}

export interface EventContext {
  correlationId?: string;
  causationId?: string;
  userId?: string;
}

export interface OutboxEventInput<T = unknown> extends DomainEventInput<T> {
  metadata?: unknown;
}

export abstract class EventPublisherPort {
  abstract publish<T = unknown>(
    event: OutboxEventInput<T>,
    options?: PublishOptions,
  ): Promise<string>;

  abstract publishDirect<T extends Record<string, unknown>>(
    input: DomainEventInput<T>,
    options?: PublishOptions,
  ): Promise<string>;

  abstract publishBatch<T = unknown>(events: OutboxEventInput<T>[]): Promise<string[]>;

  abstract publishWithTransaction<T extends Record<string, unknown>, S = unknown>(
    tx: S,
    input: DomainEventInput<T>,
  ): Promise<string>;
}

export const EVENT_PUBLISHER_TOKEN = Symbol('EVENT_PUBLISHER_TOKEN');
