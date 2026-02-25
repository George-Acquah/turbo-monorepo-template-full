import { Schema } from 'mongoose';

export interface AddressDocument {
  _id: string;
  user_id: string;
  label?: string | null;
  full_name: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  region?: string | null;
  postal_code?: string | null;
  country: string;
  phone?: string | null;
  is_default: boolean;
  is_shipping_default: boolean;
  is_billing_default: boolean;
  latitude?: unknown;
  longitude?: unknown;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export const AddressSchema = new Schema<AddressDocument>(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true },
    label: { type: String, default: null },
    full_name: { type: String, required: true },
    address_line_1: { type: String, required: true },
    address_line_2: { type: String, default: null },
    city: { type: String, required: true },
    region: { type: String, default: null },
    postal_code: { type: String, default: null },
    country: { type: String, default: 'GH', required: true },
    phone: { type: String, default: null },
    is_default: { type: Boolean, default: false, required: true },
    is_shipping_default: { type: Boolean, default: false, required: true },
    is_billing_default: { type: Boolean, default: false, required: true },
    latitude: { type: Schema.Types.Decimal128, default: null },
    longitude: { type: Schema.Types.Decimal128, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: () => new Date(), required: true },
    updated_at: { type: Date, default: () => new Date(), required: true },
    deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    collection: 'addresses',
  },
);

AddressSchema.index({ user_id: 1 });
AddressSchema.index({ user_id: 1, is_default: 1 });
