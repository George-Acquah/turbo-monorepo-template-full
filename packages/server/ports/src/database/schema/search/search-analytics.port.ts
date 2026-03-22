import { PopularSearchRecord, RecordSearchQueryInput, SearchQueryRecord, UpsertPopularSearchInput } from './search.types';

export abstract class SearchAnalyticsStorePort {
  abstract recordQuery(input: RecordSearchQueryInput): Promise<SearchQueryRecord>;
  abstract upsertPopularSearch(input: UpsertPopularSearchInput): Promise<PopularSearchRecord>;
  abstract listPopularSearches(limit?: number): Promise<PopularSearchRecord[]>;
}

export const SEARCH_ANALYTICS_STORE_TOKEN = Symbol('SEARCH_ANALYTICS_STORE_TOKEN');
