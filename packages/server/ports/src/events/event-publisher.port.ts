import { AggregateType } from '@workspace/constants';
import { AllEventsMap, EventType, PublishOptions } from '@workspace/types';

export interface EventContext {
  correlationId?: string;
  causationId?: string;
  userId?: string;
}

/**
 * 1. Base input structure
 */
interface BaseEventInput<T> extends EventContext {
  aggregateType: AggregateType;
  aggregateId: string;
  payload: T;
}

/**
 * 2. Discriminated Union for Inputs
 * This maps every EventType to its mandatory payload shape.
 */
export type StrictlyTypedEventInput<K extends EventType = EventType> = {
  [P in K]: BaseEventInput<AllEventsMap[P]> & { eventType: P };
}[K];

// Outbox wrapper that maintains the exact same type mapping
export type StrictlyTypedOutboxInput<K extends EventType = EventType> =
  StrictlyTypedEventInput<K> & {
    metadata?: unknown;
  };

export abstract class EventPublisherPort {
  /**
   * Publishes via the outbox pattern.
   * The payload is automatically enforced based on the eventType provided.
   */
  abstract publish<K extends EventType>(
    event: StrictlyTypedOutboxInput<K>,
    options?: PublishOptions,
  ): Promise<string>;

  /**
   * Publishes directly bypassing the outbox.
   */
  abstract publishDirect<K extends EventType>(
    input: StrictlyTypedEventInput<K>,
    options?: PublishOptions,
  ): Promise<string>;

  /**
   * Publishes a batch of outbox events.
   * Tuple/Array handling allows every single event in the array to be type-checked independently.
   */
  abstract publishBatch(events: StrictlyTypedOutboxInput<EventType>[]): Promise<string[]>;

  /**
   * Transactional publishing.
   */
  abstract publishWithTransaction<K extends EventType, S = unknown>(
    tx: S,
    input: StrictlyTypedEventInput<K>,
  ): Promise<string>;
}

export const EVENT_PUBLISHER_TOKEN = Symbol('EVENT_PUBLISHER_TOKEN');
