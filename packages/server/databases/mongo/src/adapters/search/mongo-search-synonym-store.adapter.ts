import {
  type SearchSynonymRecord,
  SearchSynonymStorePort,
  type UpsertSearchSynonymInput,
} from '@repo/ports';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  type SearchSynonymDocument,
  SearchSynonymModelName,
} from '../../schemas/search/search-synonym.schema';
import { generateDocumentId } from '../../utils/document-id';

@Injectable()
export class MongoSearchSynonymStoreAdapter implements SearchSynonymStorePort {
  constructor(
    @InjectModel(SearchSynonymModelName)
    private readonly model: Model<SearchSynonymDocument>,
  ) {}

  async upsert(input: UpsertSearchSynonymInput): Promise<SearchSynonymRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { term: input.term },
        {
          $set: input,
          $setOnInsert: {
            id: generateDocumentId('syn'),
          },
        },
        { new: true, upsert: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  async findByTerm(term: string): Promise<SearchSynonymRecord | null> {
    const row = await this.model.findOne({ term }).lean().exec();
    return row ? this.map(row) : null;
  }

  async listActive(): Promise<SearchSynonymRecord[]> {
    const rows = await this.model.find({ isActive: true }).sort({ term: 1 }).lean().exec();
    return rows.map((row) => this.map(row));
  }

  private map(row: any): SearchSynonymRecord {
    return {
      id: row.id,
      term: row.term ?? '',
      synonyms: row.synonyms ?? [],
      bidirectional: row.bidirectional ?? true,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    };
  }
}
