import {
  type PopularSearchRecord,
  type RecordSearchQueryInput,
  type SearchQueryRecord,
  SearchAnalyticsStorePort,
  type UpsertPopularSearchInput,
} from '@repo/ports';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  type PopularSearchDocument,
  PopularSearchModelName,
} from '../../schemas/search/popular-search.schema';
import {
  type SearchQueryDocument,
  SearchQueryModelName,
} from '../../schemas/search/search-query.schema';
import { generateDocumentId } from '../../utils/document-id';

@Injectable()
export class MongoSearchAnalyticsStoreAdapter implements SearchAnalyticsStorePort {
  constructor(
    @InjectModel(SearchQueryModelName)
    private readonly queryModel: Model<SearchQueryDocument>,
    @InjectModel(PopularSearchModelName)
    private readonly popularSearchModel: Model<PopularSearchDocument>,
  ) {}

  async recordQuery(input: RecordSearchQueryInput): Promise<SearchQueryRecord> {
    const created = await this.queryModel.create({
      id: generateDocumentId('sqr'),
      ...input,
    });

    return this.mapQuery(created.toObject());
  }

  async upsertPopularSearch(input: UpsertPopularSearchInput): Promise<PopularSearchRecord> {
    const row = await this.popularSearchModel
      .findOneAndUpdate(
        { query: input.query },
        {
          $set: {
            ...input,
          },
          $setOnInsert: {
            id: generateDocumentId('psr'),
          },
        },
        { new: true, upsert: true, lean: true },
      )
      .exec();

    return this.mapPopular(row);
  }

  async listPopularSearches(limit = 20): Promise<PopularSearchRecord[]> {
    const rows = await this.popularSearchModel
      .find({ isActive: true })
      .sort({ score: -1, searchCount: -1 })
      .limit(limit)
      .lean()
      .exec();

    return rows.map((row) => this.mapPopular(row));
  }

  private mapQuery(row: any): SearchQueryRecord {
    return {
      id: row.id,
      query: row.query ?? '',
      normalizedQuery: row.normalizedQuery ?? '',
      userId: row.userId ?? null,
      sessionId: row.sessionId ?? null,
      resultCount: row.resultCount ?? 0,
      clickedIds: row.clickedIds ?? [],
      filters: row.filters ?? null,
      createdAt: row.createdAt ?? new Date(),
    };
  }

  private mapPopular(row: any): PopularSearchRecord {
    return {
      id: row.id,
      query: row.query ?? '',
      searchCount: row.searchCount ?? 0,
      clickCount: row.clickCount ?? 0,
      conversionCount: row.conversionCount ?? 0,
      score: row.score ?? 0,
      displayText: row.displayText ?? null,
      isActive: row.isActive ?? true,
      lastSearchedAt: row.lastSearchedAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    };
  }
}
