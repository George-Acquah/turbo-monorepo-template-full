import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JobNames, QueueNames } from '@workspace/constants';
import type {
  LoggerPort,
  MetricsPort,
  OutboxEventPersistence,
  OutboxEventRepositoryPort,
  QueueBusPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { OutboxDispatchService } from '../src/services/outbox-dispatch.service';

type OutboxMock = Pick<
  OutboxEventRepositoryPort,
  | 'claimPendingEvents'
  | 'reclaimStuckProcessing'
  | 'pruneProcessedEvents'
  | 'markProcessed'
  | 'markFailed'
>;

function buildRow(overrides: Partial<OutboxEventPersistence> = {}): OutboxEventPersistence {
  return {
    id: 'obe_1',
    aggregateType: 'Payment',
    aggregateId: 'pay_1',
    eventType: 'workspace.billing.payment.verified',
    eventVersion: 1,
    payload: { amount: 100 },
    metadata: {
      workspaceEvent: {
        schemaVersion: 1,
        occurredAt: '2026-08-04T00:00:00.000Z',
        enqueuedAt: '2026-08-04T00:00:00.000Z',
        actor: { type: 'user', userId: 'user-123' },
        trace: { correlationId: 'corr_1' },
        retryCount: 0,
      },
    },
    correlationId: 'corr_1',
    maxAttempts: 5,
    status: 'PROCESSING',
    publishedAt: null,
    attempts: 0,
    lastAttemptAt: null,
    nextRetryAt: null,
    lastError: null,
    partitionKey: null,
    createdAt: new Date('2026-08-04T00:00:00.000Z'),
    updatedAt: new Date('2026-08-04T00:00:00.000Z'),
    ...overrides,
  };
}

describe('OutboxDispatchService', () => {
  let outbox: ReturnType<typeof createMock<OutboxMock>>;
  let bus: ReturnType<typeof createMock<Pick<QueueBusPort, 'enqueue'>>>;
  let metrics: ReturnType<typeof createMock<Pick<MetricsPort, 'increment' | 'time'>>>;
  let service: OutboxDispatchService;

  beforeEach(() => {
    outbox = createMock<OutboxMock>([
      'claimPendingEvents',
      'reclaimStuckProcessing',
      'pruneProcessedEvents',
      'markProcessed',
      'markFailed',
    ]);
    outbox.claimPendingEvents.mockResolvedValue([]);
    outbox.reclaimStuckProcessing.mockResolvedValue(0);
    outbox.pruneProcessedEvents.mockResolvedValue(0);
    outbox.markProcessed.mockResolvedValue({} as never);
    outbox.markFailed.mockResolvedValue({} as never);

    bus = createMock<Pick<QueueBusPort, 'enqueue'>>(['enqueue']);
    bus.enqueue.mockResolvedValue(undefined as never);

    metrics = createMock<Pick<MetricsPort, 'increment' | 'time'>>(['increment', 'time']);
    // The service wraps the drain in metrics.time when available — run the
    // wrapped fn so behaviour under test is unchanged by instrumentation.
    metrics.time.mockImplementation(
      (async (_name: string, _tags: unknown, fn: () => Promise<unknown>) => fn()) as never,
    );

    const logger = createMock<Pick<LoggerPort, 'debug' | 'log' | 'warn' | 'error'>>([
      'debug',
      'log',
      'warn',
      'error',
    ]);

    service = new OutboxDispatchService(
      bus as unknown as QueueBusPort,
      outbox as unknown as OutboxEventRepositoryPort,
      metrics as unknown as MetricsPort,
      logger as unknown as LoggerPort,
    );
  });

  describe('drain', () => {
    it('claims rows rather than plainly reading them', async () => {
      await service.process({ batchId: 'outbox', mode: 'drain' });

      // The claim is what makes concurrent workers safe; a plain read here
      // would let two replicas dispatch the same event twice.
      expect(outbox.claimPendingEvents).toHaveBeenCalledWith(100);
    });

    it('enqueues each claimed row onto DOMAIN_EVENTS and marks it processed', async () => {
      outbox.claimPendingEvents.mockResolvedValueOnce([buildRow()]);

      await service.process({ batchId: 'outbox' });

      expect(bus.enqueue).toHaveBeenCalledWith(
        QueueNames.DOMAIN_EVENTS,
        JobNames.PROCESS_DOMAIN_EVENT,
        expect.objectContaining({ eventId: 'obe_1', eventType: 'workspace.billing.payment.verified' }),
        expect.objectContaining({ jobId: 'obe_1' }),
      );
      expect(outbox.markProcessed).toHaveBeenCalledWith('obe_1');
    });

    it('treats a missing mode as a drain', async () => {
      await service.process({ batchId: 'outbox' });

      expect(outbox.claimPendingEvents).toHaveBeenCalled();
      expect(outbox.reclaimStuckProcessing).not.toHaveBeenCalled();
    });

    it('does not claim again when the batch is empty', async () => {
      await service.process({ batchId: 'outbox' });

      expect(bus.enqueue).not.toHaveBeenCalled();
      expect(outbox.markProcessed).not.toHaveBeenCalled();
    });
  });

  describe('adaptive drain', () => {
    // A short batch means the backlog is cleared.
    it('stops after a single pass when the batch comes back short', async () => {
      outbox.claimPendingEvents.mockResolvedValueOnce([buildRow()]);

      await service.process({ batchId: 'outbox' });

      expect(outbox.claimPendingEvents).toHaveBeenCalledTimes(1);
    });

    it('keeps draining while batches come back full', async () => {
      const fullBatch = Array.from({ length: 100 }, (_, i) => buildRow({ id: `obe_${i}` }));
      outbox.claimPendingEvents
        .mockResolvedValueOnce(fullBatch)
        .mockResolvedValueOnce(fullBatch)
        .mockResolvedValueOnce([buildRow()]);

      await service.process({ batchId: 'outbox' });

      // Without this, throughput would be capped at 100 rows per poll tick.
      expect(outbox.claimPendingEvents).toHaveBeenCalledTimes(3);
    });

    it('gives up at the iteration cap rather than looping forever', async () => {
      const fullBatch = Array.from({ length: 100 }, (_, i) => buildRow({ id: `obe_${i}` }));
      outbox.claimPendingEvents.mockResolvedValue(fullBatch);

      await service.process({ batchId: 'outbox' });

      expect(outbox.claimPendingEvents).toHaveBeenCalledTimes(10);
    });

    it('gives up when the wall-clock budget is exhausted', async () => {
      const fullBatch = Array.from({ length: 100 }, (_, i) => buildRow({ id: `obe_${i}` }));
      outbox.claimPendingEvents.mockResolvedValue(fullBatch);

      // Jump past the 10s budget after the first pass, leaving the iteration
      // cap untouched so this asserts the time bound specifically.
      const realNow = Date.now.bind(Date);
      const start = realNow();
      let call = 0;
      const spy = jest.spyOn(Date, 'now').mockImplementation(() => {
        call += 1;
        return call <= 1 ? start : start + 11_000;
      });

      try {
        await service.process({ batchId: 'outbox' });
      } finally {
        spy.mockRestore();
      }

      expect(outbox.claimPendingEvents).toHaveBeenCalledTimes(1);
    });
  });

  describe('failure handling', () => {
    it('schedules a retry with an explicit retryAt when attempts remain', async () => {
      outbox.claimPendingEvents.mockResolvedValueOnce([buildRow({ attempts: 1, maxAttempts: 5 })]);
      bus.enqueue.mockRejectedValueOnce(new Error('redis down'));

      await service.process({ batchId: 'outbox' });

      const [id, message, retryAt] = outbox.markFailed.mock.calls[0]!;
      expect(id).toBe('obe_1');
      expect(message).toBe('redis down');
      // A Date here is what puts the row back in claimPendingEvents' reach.
      expect(retryAt).toBeInstanceOf(Date);
      expect(outbox.markFailed).toHaveBeenCalledTimes(1);
    });

    it('backs off exponentially on the attempt count', async () => {
      outbox.claimPendingEvents.mockResolvedValueOnce([buildRow({ attempts: 3, maxAttempts: 5 })]);
      bus.enqueue.mockRejectedValueOnce(new Error('redis down'));

      const before = Date.now();
      await service.process({ batchId: 'outbox' });

      // attempts becomes 4, so delay is 1000 * 2^3 = 8s.
      const retryAt = outbox.markFailed.mock.calls[0]![2] as Date;
      expect(retryAt.getTime() - before).toBeGreaterThanOrEqual(8_000);
      expect(retryAt.getTime() - before).toBeLessThan(9_000);
    });

    it('dead-letters with a null retryAt once the budget is exhausted', async () => {
      outbox.claimPendingEvents.mockResolvedValueOnce([buildRow({ attempts: 4, maxAttempts: 5 })]);
      bus.enqueue
        .mockRejectedValueOnce(new Error('permanent'))
        .mockResolvedValueOnce(undefined as never);

      await service.process({ batchId: 'outbox' });

      // null (not undefined) is what the adapter reads as terminal.
      expect(outbox.markFailed).toHaveBeenCalledWith('obe_1', 'permanent', null);
    });

    it('carries the payload onto the DLQ so the row stays replayable', async () => {
      outbox.claimPendingEvents.mockResolvedValueOnce([buildRow({ attempts: 4, maxAttempts: 5 })]);
      bus.enqueue
        .mockRejectedValueOnce(new Error('permanent'))
        .mockResolvedValueOnce(undefined as never);

      await service.process({ batchId: 'outbox' });

      expect(bus.enqueue).toHaveBeenCalledWith(
        QueueNames.DEAD_LETTER,
        JobNames.PROCESS_DLQ_EVENT,
        expect.objectContaining({
          eventId: 'obe_1',
          attempts: 5,
          payload: { amount: 100 },
        }),
        expect.anything(),
      );
    });

    it('does not let one bad row stop the rest of the batch', async () => {
      outbox.claimPendingEvents.mockResolvedValueOnce([
        buildRow({ id: 'obe_1' }),
        buildRow({ id: 'obe_2' }),
      ]);
      bus.enqueue
        .mockRejectedValueOnce(new Error('transient'))
        .mockResolvedValueOnce(undefined as never);

      await service.process({ batchId: 'outbox' });

      expect(outbox.markProcessed).toHaveBeenCalledWith('obe_2');
    });
  });

  describe('reap', () => {
    it('reclaims stranded PROCESSING rows and does not drain', async () => {
      outbox.reclaimStuckProcessing.mockResolvedValueOnce(3);

      await service.process({ batchId: 'outbox-reap', mode: 'reap' });

      expect(outbox.claimPendingEvents).not.toHaveBeenCalled();
      const [stuckBefore] = outbox.reclaimStuckProcessing.mock.calls[0]!;
      expect(stuckBefore).toBeInstanceOf(Date);
      // 5 minutes back, give or take test execution time.
      expect(Date.now() - (stuckBefore as Date).getTime()).toBeGreaterThanOrEqual(299_000);
    });
  });

  describe('prune', () => {
    it('deletes processed rows past the retention window and does not drain', async () => {
      outbox.pruneProcessedEvents.mockResolvedValueOnce(42);

      await service.process({ batchId: 'outbox-prune', mode: 'prune' });

      expect(outbox.claimPendingEvents).not.toHaveBeenCalled();
      expect(outbox.reclaimStuckProcessing).not.toHaveBeenCalled();

      const [olderThan] = outbox.pruneProcessedEvents.mock.calls[0]!;
      const sevenDays = 7 * 24 * 60 * 60 * 1_000;
      expect(Date.now() - (olderThan as Date).getTime()).toBeGreaterThanOrEqual(sevenDays - 1_000);
      expect(Date.now() - (olderThan as Date).getTime()).toBeLessThan(sevenDays + 1_000);
    });

    it('each mode routes to exactly one sweep', async () => {
      await service.process({ batchId: 'x', mode: 'prune' });
      expect(outbox.pruneProcessedEvents).toHaveBeenCalledTimes(1);
      expect(outbox.reclaimStuckProcessing).not.toHaveBeenCalled();
      expect(outbox.claimPendingEvents).not.toHaveBeenCalled();
    });
  });
});
