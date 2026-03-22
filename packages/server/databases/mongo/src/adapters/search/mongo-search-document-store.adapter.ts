import {
  type SearchDocumentFilters,
  type SearchDocumentRecord,
  SearchDocumentStorePort,
} from '@repo/ports';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import {
  type SearchDocumentDocument,
  SearchDocumentModelName,
} from '../../schemas/search/search-document.schema';
import { generateDocumentId } from '../../utils/document-id';

@Injectable()
export class MongoSearchDocumentStoreAdapter implements SearchDocumentStorePort {
  constructor(
    @InjectModel(SearchDocumentModelName)
    private readonly model: Model<SearchDocumentDocument>,
  ) {}

  async upsertDocument(
    document: Omit<SearchDocumentRecord, 'createdAt' | 'updatedAt' | 'indexedAt'> &
      Partial<Pick<SearchDocumentRecord, 'createdAt' | 'updatedAt' | 'indexedAt'>>,
  ): Promise<SearchDocumentRecord> {
    const row = await this.model
      .findOneAndUpdate(
        { entityType: document.entityType, entityId: document.entityId },
        {
          $set: {
            ...document,
            indexedAt: document.indexedAt ?? new Date(),
          },
          $setOnInsert: {
            id: document.id || generateDocumentId('sdoc'),
          },
        },
        { new: true, upsert: true, lean: true },
      )
      .exec();

    return this.map(row);
  }

  async removeDocument(entityType: string, entityId: string): Promise<void> {
    await this.model.deleteOne({ entityType, entityId }).exec();
  }

  async findByEntity(entityType: string, entityId: string): Promise<SearchDocumentRecord | null> {
    const row = await this.model.findOne({ entityType, entityId }).lean().exec();
    return row ? this.map(row) : null;
  }

  async search(query: string, filters?: SearchDocumentFilters): Promise<SearchDocumentRecord[]> {
    const where: FilterQuery<SearchDocumentDocument> = {
      ...(filters?.entityType ? { entityType: filters.entityType } : {}),
      ...(filters?.brandId ? { brandId: filters.brandId } : {}),
      ...(filters?.inStock !== undefined ? { inStock: filters.inStock } : {}),
      ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters?.isFeatured !== undefined ? { isFeatured: filters.isFeatured } : {}),
      ...(filters?.isOnSale !== undefined ? { isOnSale: filters.isOnSale } : {}),
      ...(filters?.categoryIds?.length ? { categoryIds: { $in: filters.categoryIds } } : {}),
      ...(filters?.collectionIds?.length
        ? { collectionIds: { $in: filters.collectionIds } }
        : {}),
    };

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {
        ...(filters.minPrice !== undefined ? { $gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { $lte: filters.maxPrice } : {}),
      };
    }

    const trimmed = query.trim();
    const finder =
      trimmed.length > 0
        ? this.model
            .find(
              {
                ...where,
                $text: { $search: trimmed },
              },
              {
                score: { $meta: 'textScore' },
              },
            )
            .sort({
              score: { $meta: 'textScore' } as never,
              boost: -1,
              updatedAt: -1,
            })
        : this.model.find(where).sort({ boost: -1, updatedAt: -1 });

    const rows = await finder
      .limit(filters?.limit ?? 20)
      .lean()
      .exec();

    return rows.map((row) => this.map(row));
  }

  private map(row: any): SearchDocumentRecord {
    return {
      id: row.id,
      entityType: row.entityType as SearchDocumentRecord['entityType'],
      entityId: row.entityId ?? '',
      title: row.title ?? '',
      description: row.description ?? null,
      content: row.content ?? null,
      tags: row.tags ?? [],
      categoryIds: row.categoryIds ?? [],
      collectionIds: row.collectionIds ?? [],
      brandId: row.brandId ?? null,
      price: row.price ?? null,
      compareAtPrice: row.compareAtPrice ?? null,
      currency: row.currency ?? 'GHS',
      rating: row.rating ?? null,
      reviewCount: row.reviewCount ?? 0,
      inStock: row.inStock ?? true,
      quantity: row.quantity ?? 0,
      viewCount: row.viewCount ?? 0,
      salesCount: row.salesCount ?? 0,
      wishlistCount: row.wishlistCount ?? 0,
      isOnSale: row.isOnSale ?? false,
      isFeatured: row.isFeatured ?? false,
      isNewArrival: row.isNewArrival ?? false,
      flashSaleId: row.flashSaleId ?? null,
      imageUrl: row.imageUrl ?? null,
      thumbnailUrl: row.thumbnailUrl ?? null,
      slug: row.slug ?? null,
      isActive: row.isActive ?? true,
      boost: row.boost ?? 1,
      metadata: row.metadata ?? null,
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
      indexedAt: row.indexedAt ?? new Date(),
    };
  }
}
