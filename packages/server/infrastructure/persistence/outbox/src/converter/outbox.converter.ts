import type {
  OutboxEventStatus,
  DLQEventStatus,
  SagaStatus,
  IdempotencyStatus,
} from '@workspace/constants';
import type {
  OutboxEventPersistence,
  DeadLetterEventPersistence,
  SagaStatePersistence,
  IdempotencyKeyPersistence,
} from '@workspace/ports';
import type {
  OutboxEvent as PrismaOutboxEvent,
  DeadLetterEvent as PrismaDeadLetterEvent,
  SagaState as PrismaSagaState,
  IdempotencyKey as PrismaIdempotencyKey,
} from '@workspace/prisma/client';

// status is a String column with a /// @check doc-comment (not a native
// Prisma enum) on all four models, so it needs the same narrowing
// UserConverter does for auth.User.userType/status. JSON columns need the
// same unknown -> Record<string, unknown> cast the other converters use.
export const OutboxConverter = {
  toOutboxEventPersistence(row: PrismaOutboxEvent): OutboxEventPersistence {
    return {
      ...row,
      status: row.status as OutboxEventStatus,
      payload: row.payload as Record<string, unknown>,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    };
  },

  toOutboxEventPartialPersistence(
    row: Partial<PrismaOutboxEvent>,
  ): Partial<OutboxEventPersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('status' in row) result.status = row.status as OutboxEventStatus;
    if ('payload' in row) result.payload = row.payload as Record<string, unknown>;
    if ('metadata' in row) result.metadata = (row.metadata as Record<string, unknown> | null) ?? null;
    return result;
  },

  toDeadLetterEventPersistence(row: PrismaDeadLetterEvent): DeadLetterEventPersistence {
    return {
      ...row,
      status: row.status as DLQEventStatus,
      payload: row.payload as Record<string, unknown>,
    };
  },

  toDeadLetterEventPartialPersistence(
    row: Partial<PrismaDeadLetterEvent>,
  ): Partial<DeadLetterEventPersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('status' in row) result.status = row.status as DLQEventStatus;
    if ('payload' in row) result.payload = row.payload as Record<string, unknown>;
    return result;
  },

  toSagaStatePersistence(row: PrismaSagaState): SagaStatePersistence {
    return {
      ...row,
      status: row.status as SagaStatus,
      data: row.data as Record<string, unknown>,
    };
  },

  toSagaStatePartialPersistence(row: Partial<PrismaSagaState>): Partial<SagaStatePersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('status' in row) result.status = row.status as SagaStatus;
    if ('data' in row) result.data = row.data as Record<string, unknown>;
    return result;
  },

  toIdempotencyKeyPersistence(row: PrismaIdempotencyKey): IdempotencyKeyPersistence {
    return {
      ...row,
      status: row.status as IdempotencyStatus,
      responsePayload: (row.responsePayload as Record<string, unknown> | null) ?? null,
    };
  },

  toIdempotencyKeyPartialPersistence(
    row: Partial<PrismaIdempotencyKey>,
  ): Partial<IdempotencyKeyPersistence> {
    const result: Record<string, unknown> = { ...row };
    if ('status' in row) result.status = row.status as IdempotencyStatus;
    if ('responsePayload' in row) {
      result.responsePayload = (row.responsePayload as Record<string, unknown> | null) ?? null;
    }
    return result;
  },
};
