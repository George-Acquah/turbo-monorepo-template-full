import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JobNames, QueueNames } from '@workspace/constants';
import type {
  LoggerPort,
  OutboxEventRepositoryPort,
  QueueBusPort,
  TransactionPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { EventPublisherService } from '../src/services/event-publisher.service';

/**
 * The nudge is what makes realtime latency milliseconds instead of the poll
 * interval. It runs on every publish, so its de-duplication and its
 * never-throw behaviour are the properties that keep it affordable and safe.
 */
describe('EventPublisherService drain nudge', () => {
  let bus: ReturnType<typeof createMock<Pick<QueueBusPort, 'enqueue'>>>;
  let service: EventPublisherService;

  const publishInput = {
    eventType: 'workspace.billing.payment.verified',
    aggregateType: 'Payment',
    aggregateId: 'pay_1',
    payload: { amount: 100 },
  } as never;

  beforeEach(() => {
    bus = createMock<Pick<QueueBusPort, 'enqueue'>>(['enqueue']);
    bus.enqueue.mockResolvedValue(undefined as never);

    const outbox = createMock<Pick<OutboxEventRepositoryPort, 'enqueueTx'>>(['enqueueTx']);
    outbox.enqueueTx.mockResolvedValue({} as never);

    const tx = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    tx.execute.mockImplementation((async (op: (t: unknown) => Promise<unknown>) =>
      op({})) as never);

    const logger = createMock<Pick<LoggerPort, 'debug' | 'log'>>(['debug', 'log']);

    service = new EventPublisherService(
      bus as unknown as QueueBusPort,
      outbox as unknown as OutboxEventRepositoryPort,
      tx as unknown as TransactionPort,
      logger as unknown as LoggerPort,
    );
  });

  function nudgeCalls() {
    return bus.enqueue.mock.calls.filter((c) => c[0] === QueueNames.OUTBOX_PROCESSOR);
  }

  it('nudges the drain after publishing', async () => {
    await service.publish(publishInput);

    expect(nudgeCalls()).toHaveLength(1);
    const [, jobName, payload] = nudgeCalls()[0]!;
    expect(jobName).toBe(JobNames.PROCESS_OUTBOX_BATCH);
    expect(payload).toMatchObject({ mode: 'drain' });
  });

  it('delays the nudge so it cannot outrun an outer transaction commit', async () => {
    await service.publish(publishInput);

    expect(nudgeCalls()[0]![3]).toMatchObject({ delay: 250, attempts: 1 });
  });

  it('collapses a burst within the same second onto one job id', async () => {
    const spy = jest.spyOn(Date, 'now').mockReturnValue(1_756_000_000_000);
    try {
      await service.publish(publishInput);
      await service.publish(publishInput);
      await service.publish(publishInput);
    } finally {
      spy.mockRestore();
    }

    // Same jobId means BullMQ keeps only the first — the debounce that lets
    // this run on every publish without flooding the queue.
    const ids = nudgeCalls().map((c) => (c[3] as { jobId: string }).jobId);
    expect(new Set(ids).size).toBe(1);
  });

  it('uses a different job id in a different second', async () => {
    const spy = jest.spyOn(Date, 'now').mockReturnValueOnce(1_756_000_000_000);
    try {
      await service.publish(publishInput);
      spy.mockReturnValue(1_756_000_002_000);
      await service.publish(publishInput);
    } finally {
      spy.mockRestore();
    }

    const ids = nudgeCalls().map((c) => (c[3] as { jobId: string }).jobId);
    expect(new Set(ids).size).toBe(2);
  });

  it('never fails a publish because the nudge failed', async () => {
    // The row is already committed at this point; a Redis hiccup must not
    // turn a successful publish into an error. The poll still drains it.
    bus.enqueue.mockRejectedValue(new Error('redis unavailable') as never);

    await expect(service.publish(publishInput)).resolves.toEqual(expect.any(String));
  });

  it('nudges once for a batch, not once per event', async () => {
    await service.publishBatch([publishInput, publishInput, publishInput] as never);

    expect(nudgeCalls()).toHaveLength(1);
  });

  it('does not nudge from publishWithTransaction, whose caller owns the commit', async () => {
    await service.publishWithTransaction({} as never, publishInput);

    expect(nudgeCalls()).toHaveLength(0);
  });
});
