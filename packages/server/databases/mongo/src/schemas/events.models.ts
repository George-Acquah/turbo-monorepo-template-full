import { ModelDefinition } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IdempotencyKeyDocument, IdempotencyKeySchema } from './idempotency-key.schema';
import { OutboxEventDocument, OutboxEventSchema } from './outbox-event.schema';
import { SagaStateDocument, SagaStateSchema } from './saga-state.schema';

export const EVENTS_MODEL_NAMES = {
  outboxEvent: 'OutboxEvent',
  idempotencyKey: 'IdempotencyKey',
  sagaState: 'SagaState',
} as const;

export interface EventModels {
  outboxEvent: Model<OutboxEventDocument>;
  idempotencyKey: Model<IdempotencyKeyDocument>;
  sagaState: Model<SagaStateDocument>;
}

export const EVENTS_MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    name: EVENTS_MODEL_NAMES.outboxEvent,
    schema: OutboxEventSchema,
    collection: 'outbox_events',
  },
  {
    name: EVENTS_MODEL_NAMES.idempotencyKey,
    schema: IdempotencyKeySchema,
    collection: 'idempotency_keys',
  },
  {
    name: EVENTS_MODEL_NAMES.sagaState,
    schema: SagaStateSchema,
    collection: 'saga_states',
  },
];
