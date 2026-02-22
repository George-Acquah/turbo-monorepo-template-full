/**
 * Domain Event Types
 *
 * Base event types and metadata interfaces used across the system.
 */

export interface DomainEventMetadata {
  correlationId: string;
  causationId?: string;
  userId?: string;
  timestamp: Date;
  version: number;
  source: string;
}

export interface DomainEvent<T = unknown, TE = string> {
  eventId: string;
  eventType: TE;
  aggregateType: string;
  aggregateId: string;
  payload: T;
  metadata: DomainEventMetadata;
}

/**
 * Outbox event creation options
 */
export interface OutboxEventOptions {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
}

/**
 * Job publish options
 */
export interface PublishOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}
