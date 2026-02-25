import { Schema } from 'mongoose';

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

export const OutboxEventSchema = new Schema<OutboxEventDocument>(
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

OutboxEventSchema.index({ status: 1 });
OutboxEventSchema.index({ event_type: 1 });
OutboxEventSchema.index({ aggregate_type: 1, aggregate_id: 1 });
OutboxEventSchema.index({ created_at: 1 });
OutboxEventSchema.index({ next_retry_at: 1 });
OutboxEventSchema.index({ correlation_id: 1 });
