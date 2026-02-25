import { Schema } from 'mongoose';

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

export const IdempotencyKeySchema = new Schema<IdempotencyKeyDocument>(
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

IdempotencyKeySchema.index({ scope: 1, key: 1 }, { unique: true });
IdempotencyKeySchema.index({ key: 1 });
IdempotencyKeySchema.index({ expires_at: 1 });
IdempotencyKeySchema.index({ status: 1 });
