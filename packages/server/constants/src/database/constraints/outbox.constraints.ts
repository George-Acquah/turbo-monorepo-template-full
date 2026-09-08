import { enumConstraint } from '../builders';
import { Schemas, Tables } from '../postgres.constants';
import { OutboxEventStatus, DLQEventStatus, SagaStatus, IdempotencyStatus } from '../../events';

// workspace_outbox — transactional outbox / DLQ / saga / idempotency.
// (This content previously lived under events.constraints.ts targeting the
// wrong schema; workspace_events is now the domain LiveEvent context — see
// events.constraints.ts.)
export const OutboxConstraints = [
  enumConstraint({
    schema: Schemas.OUTBOX,
    table: Tables.OUTBOX_EVENTS,
    column: 'status',
    values: OutboxEventStatus,
  }),
  enumConstraint({
    schema: Schemas.OUTBOX,
    table: Tables.DEAD_LETTER_EVENTS,
    column: 'status',
    values: DLQEventStatus,
  }),
  enumConstraint({
    schema: Schemas.OUTBOX,
    table: Tables.SAGA_STATES,
    column: 'status',
    values: SagaStatus,
  }),
  enumConstraint({
    schema: Schemas.OUTBOX,
    table: Tables.IDEMPOTENCY_KEYS,
    column: 'status',
    values: IdempotencyStatus,
  }),
] as const;
