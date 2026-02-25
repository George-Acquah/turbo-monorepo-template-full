import { Schema } from 'mongoose';

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

export const SagaStateSchema = new Schema<SagaStateDocument>(
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

SagaStateSchema.index({ correlation_id: 1 }, { unique: true });
SagaStateSchema.index({ saga_type: 1 });
SagaStateSchema.index({ status: 1 });
SagaStateSchema.index({ order_id: 1 });
SagaStateSchema.index({ payment_id: 1 });
SagaStateSchema.index({ timeout_at: 1 });
SagaStateSchema.index({ started_at: 1 });
