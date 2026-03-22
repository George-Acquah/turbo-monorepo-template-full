import {
  CONTEXT_TOKEN,
  type ContextPort,
  type DatabaseTx,
  type PaymentConfigRecord,
  PaymentConfigStorePort,
  type UpsertPaymentConfigInput,
} from '@repo/ports';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { generateId } from '../../utils/generate-id';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';
import { toInputJson, toNumber, toRecord } from '../../utils/prisma-mappers';

@Injectable()
export class PrismaPaymentConfigStoreAdapter implements PaymentConfigStorePort {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly context?: ContextPort,
  ) {}

  async getByProvider(provider: string): Promise<PaymentConfigRecord | null> {
    const row = await resolvePrismaClient(this.prisma, this.context).paymentConfig.findUnique({
      where: { provider: provider as never },
    });

    return row ? this.mapConfig(row) : null;
  }

  async upsert(
    data: UpsertPaymentConfigInput,
    tx?: DatabaseTx,
  ): Promise<PaymentConfigRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).paymentConfig.upsert({
      where: { provider: data.provider },
      create: {
        id: generateId('pcf'),
        provider: data.provider,
        publicKey: data.publicKey ?? null,
        secretKey: data.secretKey ?? null,
        webhookSecret: data.webhookSecret ?? null,
        isLive: data.isLive,
        supportedMethods: data.supportedMethods,
        feePercentage: data.feePercentage ?? null,
        feeFixed: data.feeFixed ?? null,
        minAmount: data.minAmount ?? null,
        maxAmount: data.maxAmount ?? null,
        isActive: data.isActive,
        metadata: toInputJson(data.metadata),
      },
      update: {
        publicKey: data.publicKey ?? null,
        secretKey: data.secretKey ?? null,
        webhookSecret: data.webhookSecret ?? null,
        isLive: data.isLive,
        supportedMethods: data.supportedMethods,
        feePercentage: data.feePercentage ?? null,
        feeFixed: data.feeFixed ?? null,
        minAmount: data.minAmount ?? null,
        maxAmount: data.maxAmount ?? null,
        isActive: data.isActive,
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapConfig(row);
  }

  async listActive(): Promise<PaymentConfigRecord[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).paymentConfig.findMany({
      where: { isActive: true },
      orderBy: { provider: 'asc' },
    });

    return rows.map((row) => this.mapConfig(row));
  }

  private mapConfig(
    row: Prisma.PaymentConfigGetPayload<Record<string, never>>,
  ): PaymentConfigRecord {
    return {
      id: row.id,
      provider: row.provider,
      publicKey: row.publicKey,
      secretKey: row.secretKey,
      webhookSecret: row.webhookSecret,
      isLive: row.isLive,
      supportedMethods: row.supportedMethods,
      feePercentage: toNumber(row.feePercentage) ?? null,
      feeFixed: row.feeFixed,
      minAmount: row.minAmount,
      maxAmount: row.maxAmount,
      isActive: row.isActive,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
