/**
 * Domain Event Types
 *
 * Base event types and metadata interfaces used across the system.
 */

import { AggregateType, EventActorType } from '@workspace/constants';
import { EventType } from '../domain-events.constants';
import { AllEventsMap } from '../payloads';

export interface DomainEventMetadata {
  correlationId: string;
  causationId?: string;
  userId?: string;
  timestamp: Date;
  version: number;
  source: string;
}

export interface WorkspaceEventActor {
  type: EventActorType;
  userId?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface WorkspaceEventTrace {
  requestId: string;
  correlationId: string;
  sessionId?: string;
}

export interface DomainEvent<T = unknown, TE = string> {
  eventId: string;
  eventType: TE;
  aggregateType: string;
  aggregateId: string;
  payload: T;
  metadata: DomainEventMetadata;
}

export interface WorkspaceEvent<T = unknown> {
  eventId: string;
  eventType: EventType;
  aggregateType: AggregateType;
  aggregateId: string;
  schemaVersion: number;
  occurredAt: string;
  enqueuedAt: string;
  actor: WorkspaceEventActor;
  trace: WorkspaceEventTrace;
  payload: T;
  /**
   * The `eventId` of the event that directly caused this one (reaction/saga
   * chains). Distinct from `trace.correlationId`, which is the business
   * transaction id shared across the whole chain (e.g. paymentId/enrolmentId
   * at saga boundaries).
   */
  causationId?: string;
  retryCount?: number;
}

/**
 * 2. The Magic: Map your AllEventsMap into a Discriminated Union
 * This forces TypeScript to match the exact payload to the exact event type.
 */
export type StrictlyTypedWorkspaceEvent<K extends EventType = EventType> = {
  [P in K]: WorkspaceEvent<AllEventsMap[P]> & { eventType: P };
}[K];

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

export interface IdempotencyConfig {
  key: string;
  //Is this correct and robust, and doesnt unnecessary hurt performance
  userId: string | null;
  scope?: string;
  ttlSeconds?: number;
}
