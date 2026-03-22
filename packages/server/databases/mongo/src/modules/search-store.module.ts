import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SEARCH_ANALYTICS_STORE_TOKEN,
  SEARCH_DOCUMENT_STORE_TOKEN,
  SEARCH_SYNONYM_STORE_TOKEN,
} from '@repo/ports';
import { MongoModule } from '../mongo.module';
import { MONGO_CONNECTION_NAME } from '../tokens/mongo.tokens';
import {
  PopularSearchModelName,
  PopularSearchSchema,
} from '../schemas/search/popular-search.schema';
import {
  SearchDocumentModelName,
  SearchDocumentSchema,
} from '../schemas/search/search-document.schema';
import {
  SearchQueryModelName,
  SearchQuerySchema,
} from '../schemas/search/search-query.schema';
import {
  SearchSynonymModelName,
  SearchSynonymSchema,
} from '../schemas/search/search-synonym.schema';
import {
  MongoSearchAnalyticsStoreAdapter,
  MongoSearchDocumentStoreAdapter,
  MongoSearchSynonymStoreAdapter,
} from '../adapters/search';

const searchModels = [
  { name: SearchDocumentModelName, schema: SearchDocumentSchema },
  { name: SearchSynonymModelName, schema: SearchSynonymSchema },
  { name: SearchQueryModelName, schema: SearchQuerySchema },
  { name: PopularSearchModelName, schema: PopularSearchSchema },
];

const searchFeatureModule = MONGO_CONNECTION_NAME
  ? MongooseModule.forFeature(searchModels, MONGO_CONNECTION_NAME)
  : MongooseModule.forFeature(searchModels);

@Global()
@Module({
  imports: [MongoModule, searchFeatureModule],
  providers: [
    MongoSearchDocumentStoreAdapter,
    MongoSearchAnalyticsStoreAdapter,
    MongoSearchSynonymStoreAdapter,
    {
      provide: SEARCH_DOCUMENT_STORE_TOKEN,
      useExisting: MongoSearchDocumentStoreAdapter,
    },
    {
      provide: SEARCH_ANALYTICS_STORE_TOKEN,
      useExisting: MongoSearchAnalyticsStoreAdapter,
    },
    {
      provide: SEARCH_SYNONYM_STORE_TOKEN,
      useExisting: MongoSearchSynonymStoreAdapter,
    },
  ],
  exports: [
    SEARCH_DOCUMENT_STORE_TOKEN,
    SEARCH_ANALYTICS_STORE_TOKEN,
    SEARCH_SYNONYM_STORE_TOKEN,
  ],
})
export class MongoSearchStoreModule {}
