import { SearchSynonymRecord, UpsertSearchSynonymInput } from './search.types';

export abstract class SearchSynonymStorePort {
  abstract upsert(input: UpsertSearchSynonymInput): Promise<SearchSynonymRecord>;
  abstract findByTerm(term: string): Promise<SearchSynonymRecord | null>;
  abstract listActive(): Promise<SearchSynonymRecord[]>;
}

export const SEARCH_SYNONYM_STORE_TOKEN = Symbol('SEARCH_SYNONYM_STORE_TOKEN');
