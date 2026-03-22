import { SearchDocumentFilters, SearchDocumentRecord } from './search.types';

export abstract class SearchDocumentStorePort {
  abstract upsertDocument(
    document: Omit<SearchDocumentRecord, 'createdAt' | 'updatedAt' | 'indexedAt'> &
      Partial<Pick<SearchDocumentRecord, 'createdAt' | 'updatedAt' | 'indexedAt'>>,
  ): Promise<SearchDocumentRecord>;
  abstract removeDocument(entityType: string, entityId: string): Promise<void>;
  abstract findByEntity(entityType: string, entityId: string): Promise<SearchDocumentRecord | null>;
  abstract search(query: string, filters?: SearchDocumentFilters): Promise<SearchDocumentRecord[]>;
}

export const SEARCH_DOCUMENT_STORE_TOKEN = Symbol('SEARCH_DOCUMENT_STORE_TOKEN');
