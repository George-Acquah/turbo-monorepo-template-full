// infrastructure/saga/prisma-saga-state.adapter.ts

import { Injectable } from '@nestjs/common';
import { SagaStatePort, SagaState } from '@repo/ports';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '../../../generated/prisma';
import { resolvePrismaClient } from '../../utils/prisma-client-resolver';

@Injectable()
export class PrismaSagaStateAdapter implements SagaStatePort {
  constructor(private readonly prisma: PrismaService) {}

  async saveTx(tx: Prisma.TransactionClient, state: SagaState): Promise<void> {
    await tx.sagaState.upsert(this.toUpsert(state));
  }

  async saveLifecycle(state: SagaState): Promise<void> {
    await resolvePrismaClient(this.prisma).sagaState.upsert(this.toUpsert(state));
  }

  async updateCompensated(correlationId: string): Promise<void> {
    await resolvePrismaClient(this.prisma).sagaState.update({
      where: { correlationId },
      data: { status: 'COMPENSATED', completedAt: new Date() },
    });
  }

  async updateCompensating(correlationId: string): Promise<void> {
    await resolvePrismaClient(this.prisma).sagaState.update({
      where: { correlationId },
      data: { status: 'COMPENSATING' },
    });
  }

  async findByCorrelationId(correlationId: string): Promise<SagaState | null> {
    const row = await resolvePrismaClient(this.prisma).sagaState.findUnique({
      where: { correlationId },
    });

    return row ? (row as SagaState) : null;
  }

  async findByType(sagaType: string): Promise<SagaState[]> {
    return resolvePrismaClient(this.prisma).sagaState.findMany({
      where: { sagaType },
      orderBy: { startedAt: 'desc' },
    }) as Promise<SagaState[]>;
  }

  private toUpsert(state: SagaState): Prisma.SagaStateUpsertArgs {
    return {
      where: { correlationId: state.correlationId },
      update: {
        status: state.status,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        failedStep: state.failedStep,
        data: state.data as Prisma.InputJsonValue,
        lastError: state.lastError,
        completedAt: state.completedAt,
        timeoutAt: state.timeoutAt,
      },
      create: {
        id: state.id,
        sagaType: state.sagaType,
        correlationId: state.correlationId,
        status: state.status,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        failedStep: state.failedStep,
        data: state.data as Prisma.InputJsonValue,
        lastError: state.lastError,
        startedAt: state.startedAt,
        timeoutAt: state.timeoutAt,
      },
    };
  }
}
