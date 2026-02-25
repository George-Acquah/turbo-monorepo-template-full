import { Injectable } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { SagaState, SagaStatePort } from '@repo/ports';
import { MongoService } from '../../mongo.service';

@Injectable()
export class MongoSagaStateAdapter implements SagaStatePort {
  constructor(private readonly mongo: MongoService) {}

  async saveTx(tx: unknown, state: SagaState): Promise<void> {
    const session = tx as ClientSession;
    await this.upsertState(state, session);
  }

  async saveLifecycle(state: SagaState): Promise<void> {
    await this.upsertState(state);
  }

  async findByCorrelationId(correlationId: string): Promise<SagaState | null> {
    const row = await this.mongo.db.events.sagaState.findOne({ correlation_id: correlationId }).lean();
    return row ? this.mapState(row) : null;
  }

  async updateCompensating(correlationId: string): Promise<void> {
    await this.mongo.db.events.sagaState.updateOne(
      { correlation_id: correlationId },
      {
        $set: {
          status: 'COMPENSATING',
          compensating: true,
          updated_at: new Date(),
        },
      },
    );
  }

  async updateCompensated(correlationId: string): Promise<void> {
    await this.mongo.db.events.sagaState.updateOne(
      { correlation_id: correlationId },
      {
        $set: {
          status: 'COMPENSATED',
          compensating: false,
          completed_at: new Date(),
          updated_at: new Date(),
        },
      },
    );
  }

  async findByType(sagaType: string): Promise<SagaState[]> {
    const rows = await this.mongo.db.events.sagaState
      .find({ saga_type: sagaType })
      .sort({ started_at: -1 })
      .lean();

    return rows.map((row) => this.mapState(row));
  }

  private async upsertState(state: SagaState, session?: ClientSession): Promise<void> {
    await this.mongo.db.events.sagaState.updateOne(
      { correlation_id: state.correlationId },
      {
        $set: {
          status: state.status,
          current_step: state.currentStep,
          completed_steps: state.completedSteps,
          failed_step: state.failedStep ?? null,
          data: state.data,
          last_error: state.lastError ?? null,
          completed_at: state.completedAt ?? null,
          timeout_at: state.timeoutAt ?? null,
          updated_at: new Date(),
        },
        $setOnInsert: {
          _id: state.id,
          saga_type: state.sagaType,
          correlation_id: state.correlationId,
          started_at: state.startedAt,
          compensating: state.status === 'COMPENSATING',
        },
      },
      {
        upsert: true,
        ...(session ? { session } : {}),
      },
    );
  }

  private mapState(row: {
    _id: string;
    saga_type: string;
    correlation_id: string;
    status: SagaState['status'];
    current_step: string;
    completed_steps: string[];
    failed_step?: string | null;
    data: Record<string, unknown>;
    last_error?: string | null;
    started_at: Date;
    completed_at?: Date | null;
    timeout_at?: Date | null;
  }): SagaState {
    return {
      id: row._id,
      sagaType: row.saga_type,
      correlationId: row.correlation_id,
      status: row.status,
      currentStep: row.current_step,
      completedSteps: row.completed_steps,
      failedStep: row.failed_step ?? undefined,
      data: row.data,
      lastError: row.last_error ?? undefined,
      startedAt: row.started_at,
      completedAt: row.completed_at ?? undefined,
      timeoutAt: row.timeout_at ?? undefined,
    };
  }
}
