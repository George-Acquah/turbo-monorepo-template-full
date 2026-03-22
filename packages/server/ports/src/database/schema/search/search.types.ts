export type SearchEntityType = 'PRODUCT' | 'COLLECTION' | 'CATEGORY' | 'BRAND';

export interface SearchDocumentRecord {
  id: string;
  entityType: SearchEntityType;
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

export interface SearchDocumentFilters {
  entityType?: SearchEntityType;
  categoryIds?: string[];
  collectionIds?: string[];
  brandId?: string;
  inStock?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface SearchSynonymRecord {
  id: string;
  term: string;
  synonyms: string[];
  bidirectional: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertSearchSynonymInput
  extends Omit<SearchSynonymRecord, 'id' | 'createdAt' | 'updatedAt'> {}

export interface SearchQueryRecord {
  id: string;
  query: string;
  normalizedQuery: string;
  userId?: string | null;
  sessionId?: string | null;
  resultCount: number;
  clickedIds: string[];
  filters?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface RecordSearchQueryInput
  extends Omit<SearchQueryRecord, 'id' | 'createdAt'> {}

export interface PopularSearchRecord {
  id: string;
  query: string;
  searchCount: number;
  clickCount: number;
  conversionCount: number;
  score: number;
  displayText?: string | null;
  isActive: boolean;
  lastSearchedAt: Date;
  updatedAt: Date;
}

export interface UpsertPopularSearchInput
  extends Omit<PopularSearchRecord, 'id' | 'updatedAt'> {}
