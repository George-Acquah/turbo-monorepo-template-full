import {
  CONTEXT_TOKEN,
  type ContextPort,
  type CreateSavedPaymentMethodInput,
  type DatabaseTx,
  type SavedPaymentMethodRecord,
  SavedPaymentMethodStorePort,
} from '@repo/ports';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { generateId } from '../../utils/generate-id';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';
import { toInputJson, toRecord } from '../../utils/prisma-mappers';

@Injectable()
export class PrismaSavedPaymentMethodStoreAdapter implements SavedPaymentMethodStorePort {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly context?: ContextPort,
  ) {}

  async create(
    data: CreateSavedPaymentMethodInput,
    tx?: DatabaseTx,
  ): Promise<SavedPaymentMethodRecord> {
    const client = resolvePrismaClient(this.prisma, this.context, tx);

    if (data.isDefault) {
      await client.savedPaymentMethod.updateMany({
        where: { userId: data.userId, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const row = await client.savedPaymentMethod.create({
      data: {
        id: generateId('spm'),
        userId: data.userId,
        provider: data.provider,
        providerToken: data.providerToken,
        type: data.type,
        displayName: data.displayName,
        cardLast4: data.cardLast4 ?? null,
        cardBrand: data.cardBrand ?? null,
        cardExpMonth: data.cardExpMonth ?? null,
        cardExpYear: data.cardExpYear ?? null,
        mobileNetwork: data.mobileNetwork ?? null,
        mobileNumber: data.mobileNumber ?? null,
        bankName: data.bankName ?? null,
        accountNumber: data.accountNumber ?? null,
        isDefault: data.isDefault,
        isActive: data.isActive,
        expiresAt: data.expiresAt ?? null,
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapPaymentMethod(row);
  }

  async listByUser(userId: string): Promise<SavedPaymentMethodRecord[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).savedPaymentMethod.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return rows.map((row) => this.mapPaymentMethod(row));
  }

  async setDefault(id: string, userId: string, tx?: DatabaseTx): Promise<void> {
    const client = resolvePrismaClient(this.prisma, this.context, tx);
    await client.savedPaymentMethod.updateMany({
      where: { userId, deletedAt: null },
      data: { isDefault: false },
    });
    await client.savedPaymentMethod.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async deactivate(id: string, tx?: DatabaseTx): Promise<void> {
    await resolvePrismaClient(this.prisma, this.context, tx).savedPaymentMethod.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date(), isDefault: false },
    });
  }

  private mapPaymentMethod(
    row: Prisma.SavedPaymentMethodGetPayload<Record<string, never>>,
  ): SavedPaymentMethodRecord {
    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider,
      providerToken: row.providerToken,
      type: row.type,
      displayName: row.displayName,
      cardLast4: row.cardLast4,
      cardBrand: row.cardBrand,
      cardExpMonth: row.cardExpMonth,
      cardExpYear: row.cardExpYear,
      mobileNetwork: row.mobileNetwork,
      mobileNumber: row.mobileNumber,
      bankName: row.bankName,
      accountNumber: row.accountNumber,
      isDefault: row.isDefault,
      isActive: row.isActive,
      expiresAt: row.expiresAt,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
