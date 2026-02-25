import { Connection, Model, Schema } from 'mongoose';

export interface OutboxEventDocument {
  _id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: unknown;
  metadata?: unknown;
  version: number;
  correlation_id?: string | null;
  causation_id?: string | null;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTERED';
  attempts: number;
  max_attempts: number;
  next_retry_at?: Date | null;
  last_error?: string | null;
  processed_at?: Date | null;
  failed_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface IdempotencyKeyDocument {
  _id: string;
  key: string;
  scope: string;
  request_hash?: string | null;
  response_data?: unknown;
  status_code?: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  entity_type?: string | null;
  entity_id?: string | null;
  expires_at: Date;
  created_at: Date;
  completed_at?: Date | null;
}

export interface SagaStateDocument {
  _id: string;
  saga_type: string;
  correlation_id: string;
  current_step: string;
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'COMPENSATING' | 'COMPENSATED' | 'FAILED';
  data: Record<string, unknown>;
  order_id?: string | null;
  payment_id?: string | null;
  user_id?: string | null;
  completed_steps: string[];
  failed_step?: string | null;
  compensating: boolean;
  last_error?: string | null;
  timeout_at?: Date | null;
  started_at: Date;
  completed_at?: Date | null;
  updated_at: Date;
}

export interface EventModels {
  outboxEvent: Model<OutboxEventDocument>;
  idempotencyKey: Model<IdempotencyKeyDocument>;
  sagaState: Model<SagaStateDocument>;
}

function getOrCreateModel<T>(
  connection: Connection,
  modelName: string,
  schema: Schema<T>,
  collectionName: string,
): Model<T> {
  const existing = connection.models[modelName] as Model<T> | undefined;
  if (existing) {
    return existing;
  }

  return connection.model<T>(modelName, schema, collectionName);
}

export function createEventModels(connection: Connection): EventModels {
  const outboxEventSchema = new Schema<OutboxEventDocument>(
    {
      _id: { type: String, required: true },
      event_type: { type: String, required: true },
      aggregate_type: { type: String, required: true },
      aggregate_id: { type: String, required: true },
      payload: { type: Schema.Types.Mixed, required: true },
      metadata: { type: Schema.Types.Mixed, default: null },
      version: { type: Number, default: 1, required: true },
      correlation_id: { type: String, default: null },
      causation_id: { type: String, default: null },
      status: { type: String, default: 'PENDING', required: true },
      attempts: { type: Number, default: 0, required: true },
      max_attempts: { type: Number, default: 5, required: true },
      next_retry_at: { type: Date, default: () => new Date() },
      last_error: { type: String, default: null },
      processed_at: { type: Date, default: null },
      failed_at: { type: Date, default: null },
      created_at: { type: Date, default: () => new Date(), required: true },
      updated_at: { type: Date, default: () => new Date(), required: true },
    },
    {
      versionKey: false,
      collection: 'outbox_events',
    },
  );

  outboxEventSchema.index({ status: 1 });
  outboxEventSchema.index({ event_type: 1 });
  outboxEventSchema.index({ aggregate_type: 1, aggregate_id: 1 });
  outboxEventSchema.index({ created_at: 1 });
  outboxEventSchema.index({ next_retry_at: 1 });
  outboxEventSchema.index({ correlation_id: 1 });

  const idempotencyKeySchema = new Schema<IdempotencyKeyDocument>(
    {
      _id: { type: String, required: true },
      key: { type: String, required: true },
      scope: { type: String, required: true },
      request_hash: { type: String, default: null },
      response_data: { type: Schema.Types.Mixed, default: null },
      status_code: { type: Number, default: null },
      status: { type: String, default: 'IN_PROGRESS', required: true },
      entity_type: { type: String, default: null },
      entity_id: { type: String, default: null },
      expires_at: { type: Date, required: true },
      created_at: { type: Date, default: () => new Date(), required: true },
      completed_at: { type: Date, default: null },
    },
    {
      versionKey: false,
      collection: 'idempotency_keys',
    },
  );

  idempotencyKeySchema.index({ scope: 1, key: 1 }, { unique: true });
  idempotencyKeySchema.index({ key: 1 });
  idempotencyKeySchema.index({ expires_at: 1 });
  idempotencyKeySchema.index({ status: 1 });

  const sagaStateSchema = new Schema<SagaStateDocument>(
    {
      _id: { type: String, required: true },
      saga_type: { type: String, required: true },
      correlation_id: { type: String, required: true },
      current_step: { type: String, required: true },
      status: { type: String, default: 'STARTED', required: true },
      data: { type: Schema.Types.Mixed, required: true },
      order_id: { type: String, default: null },
      payment_id: { type: String, default: null },
      user_id: { type: String, default: null },
      completed_steps: { type: [String], default: [], required: true },
      failed_step: { type: String, default: null },
      compensating: { type: Boolean, default: false, required: true },
      last_error: { type: String, default: null },
      timeout_at: { type: Date, default: null },
      started_at: { type: Date, default: () => new Date(), required: true },
      completed_at: { type: Date, default: null },
      updated_at: { type: Date, default: () => new Date(), required: true },
    },
    {
      versionKey: false,
      collection: 'saga_states',
    },
  );

  sagaStateSchema.index({ correlation_id: 1 }, { unique: true });
  sagaStateSchema.index({ saga_type: 1 });
  sagaStateSchema.index({ status: 1 });
  sagaStateSchema.index({ order_id: 1 });
  sagaStateSchema.index({ payment_id: 1 });
  sagaStateSchema.index({ timeout_at: 1 });
  sagaStateSchema.index({ started_at: 1 });

  return {
    outboxEvent: getOrCreateModel(connection, 'OutboxEvent', outboxEventSchema, 'outbox_events'),
    idempotencyKey: getOrCreateModel(
      connection,
      'IdempotencyKey',
      idempotencyKeySchema,
      'idempotency_keys',
    ),
    sagaState: getOrCreateModel(connection, 'SagaState', sagaStateSchema, 'saga_states'),
  };
}
