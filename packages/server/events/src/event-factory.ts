import { IdPrefixes } from '@workspace/constants';
import type { WorkspaceEvent } from '@workspace/types';
import { generateId } from '@workspace/utils';

export interface CreateEventContext {
  actor: WorkspaceEvent['actor'];
  trace: WorkspaceEvent['trace'];
  aggregateType: WorkspaceEvent['aggregateType'];
  aggregateId: string;
  causationId?: string;
  eventId?: string;
  occurredAt?: string;
}

/**
 * Constructs a standardized Workspace domain event envelope.
 */
export function createEvent<T>(
  eventType: WorkspaceEvent['eventType'],
  payload: T,
  context: CreateEventContext,
  schemaVersion = 1,
): WorkspaceEvent<T> {
  const now = new Date().toISOString();

  return {
    eventId: context.eventId ?? generateId(IdPrefixes.OUTBOX_EVENT),
    eventType,
    aggregateType: context.aggregateType,
    aggregateId: context.aggregateId,
    schemaVersion,
    occurredAt: context.occurredAt ?? now,
    enqueuedAt: now,
    actor: context.actor,
    trace: context.trace,
    payload,
    causationId: context.causationId,
    retryCount: 0,
  };
}
