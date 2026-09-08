import { describe, it, expect, beforeEach } from '@jest/globals';
import { QueueNames } from '@workspace/constants';
import type {
  DeadLetterEventRepositoryPort,
  LoggerPort,
  MetricsPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { DeadLetterDispatchService } from '../src/services/dead-letter-dispatch.service';

describe('DeadLetterDispatchService', () => {
  let deadLetters: ReturnType<typeof createMock<Pick<DeadLetterEventRepositoryPort, 'create'>>>;
  let logger: ReturnType<typeof createMock<Pick<LoggerPort, 'error'>>>;
  let service: DeadLetterDispatchService;

  beforeEach(() => {
    deadLetters = createMock<Pick<DeadLetterEventRepositoryPort, 'create'>>(['create']);
    deadLetters.create.mockResolvedValue({} as never);
    logger = createMock<Pick<LoggerPort, 'error'>>(['error']);
    const metrics = createMock<Pick<MetricsPort, 'increment'>>(['increment']);

    service = new DeadLetterDispatchService(
      deadLetters as unknown as DeadLetterEventRepositoryPort,
      logger as unknown as LoggerPort,
      metrics as unknown as MetricsPort,
    );
  });

  it('persists the dead-lettered event so the job terminates', async () => {
    await service.process({
      eventId: 'obe_1',
      eventType: 'workspace.billing.payment.verified',
      error: 'permanent failure',
      stack: 'Error: permanent failure\n  at x',
      attempts: 5,
      payload: { amount: 100 },
    });

    expect(deadLetters.create).toHaveBeenCalledWith({
      source: QueueNames.DEAD_LETTER,
      originalEventId: 'obe_1',
      eventType: 'workspace.billing.payment.verified',
      payload: { amount: 100 },
      errorMessage: 'permanent failure',
      errorStack: 'Error: permanent failure\n  at x',
    });
  });

  it('omits status so the column default applies', async () => {
    await service.process({ eventId: 'obe_1', eventType: 'x', error: 'boom' });

    // The DLQEventStatus union in ports is stale relative to the DB CHECK
    // constraint; sending any of its values would be rejected.
    expect(deadLetters.create.mock.calls[0]![0]).not.toHaveProperty('status');
  });

  it('defaults a missing payload to an empty object rather than null', async () => {
    await service.process({ eventId: 'obe_1', eventType: 'x', error: 'boom' });

    // payload is NOT NULL in the schema.
    expect(deadLetters.create.mock.calls[0]![0]).toMatchObject({ payload: {}, errorStack: null });
  });

  it('never writes the payload into the log', async () => {
    await service.process({
      eventId: 'obe_1',
      eventType: 'workspace.billing.payment.verified',
      error: 'boom',
      payload: { pan: '4111111111111111', email: 'member@example.com' },
    });

    const logged = JSON.stringify(logger.error.mock.calls);
    expect(logged).not.toContain('4111111111111111');
    expect(logged).not.toContain('member@example.com');
    expect(logged).toContain('obe_1');
  });
});
