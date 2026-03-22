import { HydratedDocument, Schema } from 'mongoose';

export interface PopularSearchPersistence {
  id: string;
  query: string;
  searchCount: number;
  clickCount: number;
  conversionCount: number;
  score: number;
  displayText?: string | null;
  isActive: boolean;
  lastSearchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PopularSearchDocument = HydratedDocument<PopularSearchPersistence>;

export const PopularSearchModelName = 'PopularSearch';

export const PopularSearchSchema = new Schema<PopularSearchPersistence>(
  {
    id: { type: String, required: true, unique: true, index: true },
    query: { type: String, required: true, unique: true },
    searchCount: { type: Number, required: true, default: 1 },
    clickCount: { type: Number, required: true, default: 0 },
    conversionCount: { type: Number, required: true, default: 0 },
    score: { type: Number, required: true, default: 0, index: true },
    displayText: String,
    isActive: { type: Boolean, required: true, default: true, index: true },
    lastSearchedAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    collection: 'popular_searches',
    timestamps: true,
    versionKey: false,
  },
);

PopularSearchSchema.index({ isActive: 1, score: -1 });
