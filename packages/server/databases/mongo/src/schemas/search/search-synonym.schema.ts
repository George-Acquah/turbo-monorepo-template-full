import { HydratedDocument, Schema } from 'mongoose';

export interface SearchSynonymPersistence {
  id: string;
  term: string;
  synonyms: string[];
  bidirectional: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SearchSynonymDocument = HydratedDocument<SearchSynonymPersistence>;

export const SearchSynonymModelName = 'SearchSynonym';

export const SearchSynonymSchema = new Schema<SearchSynonymPersistence>(
  {
    id: { type: String, required: true, unique: true, index: true },
    term: { type: String, required: true, unique: true, index: true },
    synonyms: { type: [String], required: true, default: [] },
    bidirectional: { type: Boolean, required: true, default: true },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  {
    collection: 'search_synonyms',
    timestamps: true,
    versionKey: false,
  },
);
