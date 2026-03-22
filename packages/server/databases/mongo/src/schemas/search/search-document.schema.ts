import { HydratedDocument, Schema } from 'mongoose';

export interface SearchDocumentPersistence {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string | null;
  content?: string | null;
  tags: string[];
  categoryIds: string[];
  collectionIds: string[];
  brandId?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  currency: string;
  rating?: number | null;
  reviewCount: number;
  inStock: boolean;
  quantity: number;
  viewCount: number;
  salesCount: number;
  wishlistCount: number;
  isOnSale: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  flashSaleId?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  slug?: string | null;
  isActive: boolean;
  boost: number;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  indexedAt: Date;
}

export type SearchDocumentDocument = HydratedDocument<SearchDocumentPersistence>;

export const SearchDocumentModelName = 'SearchDocument';

export const SearchDocumentSchema = new Schema<SearchDocumentPersistence>(
  {
    id: { type: String, required: true, unique: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    content: String,
    tags: { type: [String], required: true, default: [] },
    categoryIds: { type: [String], required: true, default: [] },
    collectionIds: { type: [String], required: true, default: [] },
    brandId: String,
    price: Number,
    compareAtPrice: Number,
    currency: { type: String, required: true, default: 'GHS' },
    rating: Number,
    reviewCount: { type: Number, required: true, default: 0 },
    inStock: { type: Boolean, required: true, default: true, index: true },
    quantity: { type: Number, required: true, default: 0 },
    viewCount: { type: Number, required: true, default: 0 },
    salesCount: { type: Number, required: true, default: 0 },
    wishlistCount: { type: Number, required: true, default: 0 },
    isOnSale: { type: Boolean, required: true, default: false, index: true },
    isFeatured: { type: Boolean, required: true, default: false, index: true },
    isNewArrival: { type: Boolean, required: true, default: false },
    flashSaleId: String,
    imageUrl: String,
    thumbnailUrl: String,
    slug: String,
    isActive: { type: Boolean, required: true, default: true, index: true },
    boost: { type: Number, required: true, default: 1 },
    metadata: Schema.Types.Mixed,
    indexedAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    collection: 'search_documents',
    timestamps: true,
    versionKey: false,
  },
);

SearchDocumentSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
SearchDocumentSchema.index({ title: 'text', description: 'text', content: 'text', tags: 'text' });
