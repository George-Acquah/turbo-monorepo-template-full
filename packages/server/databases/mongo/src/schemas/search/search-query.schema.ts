import { HydratedDocument, Schema } from 'mongoose';

export interface SearchQueryPersistence {
  id: string;
  query: string;
  normalizedQuery: string;
  userId?: string | null;
  sessionId?: string | null;
  resultCount: number;
  clickedIds: string[];
  filters?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SearchQueryDocument = HydratedDocument<SearchQueryPersistence>;

export const SearchQueryModelName = 'SearchQuery';

export const SearchQuerySchema = new Schema<SearchQueryPersistence>(
  {
    id: { type: String, required: true, unique: true, index: true },
    query: { type: String, required: true },
    normalizedQuery: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    sessionId: String,
    resultCount: { type: Number, required: true },
    clickedIds: { type: [String], required: true, default: [] },
    filters: Schema.Types.Mixed,
  },
  {
    collection: 'search_queries',
    timestamps: true,
    versionKey: false,
  },
);
