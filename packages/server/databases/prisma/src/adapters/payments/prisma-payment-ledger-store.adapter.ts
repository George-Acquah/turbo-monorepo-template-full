import { IdPrefixes } from '@repo/constants';
import {
  CONTEXT_TOKEN,
  type ContextPort,
  type CreatePaymentAttemptInput,
  type CreatePaymentInput,
  type CreateRefundInput,
  type DatabaseTx,
  type PaymentAttemptRecord,
  PaymentLedgerStorePort,
  type PaymentRecord,
  type RefundRecord,
} from '@repo/ports';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';
import { generateId } from '../../utils/generate-id';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';
import { toInputJson, toRecord } from '../../utils/prisma-mappers';

@Injectable()
export class PrismaPaymentLedgerStoreAdapter implements PaymentLedgerStorePort {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CONTEXT_TOKEN) private readonly context?: ContextPort,
  ) {}

  async createPayment(data: CreatePaymentInput, tx?: DatabaseTx): Promise<PaymentRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).payment.create({
      data: {
        id: generateId(IdPrefixes.PAYMENT),
        orderId: data.orderId,
        provider: data.provider,
        method: data.method ?? null,
        providerPaymentId: data.providerPaymentId ?? null,
        providerReference: data.providerReference ?? null,
        authorizationCode: data.authorizationCode ?? null,
        amount: data.amount,
        currency: data.currency,
        providerFee: data.providerFee ?? null,
        netAmount: data.netAmount ?? null,
        status: data.status,
        initiatedAt: data.initiatedAt ?? null,
        processingAt: data.processingAt ?? null,
        paidAt: data.paidAt ?? null,
        failedAt: data.failedAt ?? null,
        cancelledAt: data.cancelledAt ?? null,
        expiredAt: data.expiredAt ?? null,
        failureCode: data.failureCode ?? null,
        failureMessage: data.failureMessage ?? null,
        cardLast4: data.cardLast4 ?? null,
        cardBrand: data.cardBrand ?? null,
        cardExpMonth: data.cardExpMonth ?? null,
        cardExpYear: data.cardExpYear ?? null,
        mobileNetwork: data.mobileNetwork ?? null,
        mobileNumber: data.mobileNumber ?? null,
        bankName: data.bankName ?? null,
        accountNumber: data.accountNumber ?? null,
        customerEmail: data.customerEmail ?? null,
        customerPhone: data.customerPhone ?? null,
        customerId: data.customerId ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        idempotencyKey: data.idempotencyKey ?? null,
        rawRequest: toInputJson(data.rawRequest),
        rawResponse: toInputJson(data.rawResponse),
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapPayment(row);
  }

  async findPaymentById(id: string): Promise<PaymentRecord | null> {
    const row = await resolvePrismaClient(this.prisma, this.context).payment.findUnique({
      where: { id },
    });

    return row ? this.mapPayment(row) : null;
  }

  async findPaymentsByOrderId(orderId: string): Promise<PaymentRecord[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapPayment(row));
  }

  async updatePaymentStatus(
    id: string,
    data: Partial<PaymentRecord> & Pick<PaymentRecord, 'status'>,
    tx?: DatabaseTx,
  ): Promise<PaymentRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).payment.update({
      where: { id },
      data: {
        status: data.status,
        providerPaymentId: data.providerPaymentId,
        providerReference: data.providerReference,
        authorizationCode: data.authorizationCode,
        providerFee: data.providerFee,
        netAmount: data.netAmount,
        initiatedAt: data.initiatedAt,
        processingAt: data.processingAt,
        paidAt: data.paidAt,
        failedAt: data.failedAt,
        cancelledAt: data.cancelledAt,
        expiredAt: data.expiredAt,
        failureCode: data.failureCode,
        failureMessage: data.failureMessage,
        cardLast4: data.cardLast4,
        cardBrand: data.cardBrand,
        cardExpMonth: data.cardExpMonth,
        cardExpYear: data.cardExpYear,
        mobileNetwork: data.mobileNetwork,
        mobileNumber: data.mobileNumber,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerId: data.customerId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        rawRequest:
          data.rawRequest === undefined ? undefined : toInputJson(data.rawRequest ?? null),
        rawResponse:
          data.rawResponse === undefined ? undefined : toInputJson(data.rawResponse ?? null),
        metadata: data.metadata === undefined ? undefined : toInputJson(data.metadata ?? null),
      },
    });

    return this.mapPayment(row);
  }

  async recordAttempt(
    data: CreatePaymentAttemptInput,
    tx?: DatabaseTx,
  ): Promise<PaymentAttemptRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).paymentAttempt.create({
      data: {
        id: generateId('pat'),
        paymentId: data.paymentId,
        attemptNumber: data.attemptNumber,
        method: data.method ?? null,
        providerRef: data.providerRef ?? null,
        status: data.status,
        failureCode: data.failureCode ?? null,
        failureMessage: data.failureMessage ?? null,
        rawResponse: toInputJson(data.rawResponse),
      },
    });

    return this.mapAttempt(row);
  }

  async createRefund(data: CreateRefundInput, tx?: DatabaseTx): Promise<RefundRecord> {
    const row = await resolvePrismaClient(this.prisma, this.context, tx).refund.create({
      data: {
        id: generateId(IdPrefixes.REFUND),
        paymentId: data.paymentId,
        orderId: data.orderId,
        providerRefundId: data.providerRefundId ?? null,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        reason: data.reason ?? null,
        internalNotes: data.internalNotes ?? null,
        requestedAt: data.requestedAt,
        processedAt: data.processedAt ?? null,
        completedAt: data.completedAt ?? null,
        failedAt: data.failedAt ?? null,
        failureCode: data.failureCode ?? null,
        failureMessage: data.failureMessage ?? null,
        requestedById: data.requestedById ?? null,
        rawResponse: toInputJson(data.rawResponse),
        metadata: toInputJson(data.metadata),
      },
    });

    return this.mapRefund(row);
  }

  async listRefundsForPayment(paymentId: string): Promise<RefundRecord[]> {
    const rows = await resolvePrismaClient(this.prisma, this.context).refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapRefund(row));
  }

  private mapPayment(row: Prisma.PaymentGetPayload<Record<string, never>>): PaymentRecord {
    return {
      id: row.id,
      orderId: row.orderId,
      provider: row.provider,
      method: row.method,
      providerPaymentId: row.providerPaymentId,
      providerReference: row.providerReference,
      authorizationCode: row.authorizationCode,
      amount: row.amount,
      currency: row.currency,
      providerFee: row.providerFee,
      netAmount: row.netAmount,
      status: row.status,
      initiatedAt: row.initiatedAt,
      processingAt: row.processingAt,
      paidAt: row.paidAt,
      failedAt: row.failedAt,
      cancelledAt: row.cancelledAt,
      expiredAt: row.expiredAt,
      failureCode: row.failureCode,
      failureMessage: row.failureMessage,
      cardLast4: row.cardLast4,
      cardBrand: row.cardBrand,
      cardExpMonth: row.cardExpMonth,
      cardExpYear: row.cardExpYear,
      mobileNetwork: row.mobileNetwork,
      mobileNumber: row.mobileNumber,
      bankName: row.bankName,
      accountNumber: row.accountNumber,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      customerId: row.customerId,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      idempotencyKey: row.idempotencyKey,
      rawRequest: toRecord(row.rawRequest) ?? null,
      rawResponse: toRecord(row.rawResponse) ?? null,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapAttempt(
    row: Prisma.PaymentAttemptGetPayload<Record<string, never>>,
  ): PaymentAttemptRecord {
    return {
      id: row.id,
      paymentId: row.paymentId,
      attemptNumber: row.attemptNumber,
      method: row.method,
      providerRef: row.providerRef,
      status: row.status,
      failureCode: row.failureCode,
      failureMessage: row.failureMessage,
      rawResponse: toRecord(row.rawResponse) ?? null,
      createdAt: row.createdAt,
    };
  }

  private mapRefund(row: Prisma.RefundGetPayload<Record<string, never>>): RefundRecord {
    return {
      id: row.id,
      paymentId: row.paymentId,
      orderId: row.orderId,
      providerRefundId: row.providerRefundId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      reason: row.reason,
      internalNotes: row.internalNotes,
      requestedAt: row.requestedAt,
      processedAt: row.processedAt,
      completedAt: row.completedAt,
      failedAt: row.failedAt,
      failureCode: row.failureCode,
      failureMessage: row.failureMessage,
      requestedById: row.requestedById,
      rawResponse: toRecord(row.rawResponse) ?? null,
      metadata: toRecord(row.metadata) ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
