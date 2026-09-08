import { describe, it, expect, beforeEach } from '@jest/globals';
import type { LoggerPort, RedisPort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { DomainEventDispatchService } from '../src/services/domain-event-dispatch.service';
import { DispatchEngine } from '../src/dispatch/dispatch.engine';

// publishRealtime is private — accessed via a narrow structural cast rather
// than exposing it publicly just for this test.
type WithPublishRealtime = {
  publishRealtime(event: unknown): Promise<void>;
};

function buildEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventId: 'evt_1',
    eventType: 'workspace.billing.payment.verified',
    aggregateType: 'Payment',
    aggregateId: 'pay_1',
    payload: { amount: 100 },
    actor: { type: 'user', userId: 'user-123' },
    trace: { correlationId: 'corr_1' },
    ...overrides,
  };
}

describe('DomainEventDispatchService.publishRealtime', () => {
  let redis: ReturnType<typeof createMock<Pick<RedisPort, 'publish'>>>;
  let service: DomainEventDispatchService;

  beforeEach(() => {
    redis = createMock<Pick<RedisPort, 'publish'>>(['publish']);
    redis.publish.mockResolvedValue(undefined as never);
    const dispatchEngine = createMock<Pick<DispatchEngine, 'dispatch'>>(['dispatch']);
    const logger = createMock<Pick<LoggerPort, 'warn'>>(['warn']);

    service = new DomainEventDispatchService(
      dispatchEngine as unknown as DispatchEngine,
      redis as unknown as RedisPort,
      logger as unknown as LoggerPort,
    );
  });

  it('publishes to realtime:user:<actor.userId>', async () => {
    const event = buildEvent();

    await (service as unknown as WithPublishRealtime).publishRealtime(event);

    expect(redis.publish).toHaveBeenCalledWith(
      'realtime:user:user-123',
      expect.objectContaining({ eventId: 'evt_1', correlationId: 'corr_1' }),
    );
  });

  it('is a no-op when the event has no actor.userId', async () => {
    const event = buildEvent({ actor: { type: 'system' } });

    await (service as unknown as WithPublishRealtime).publishRealtime(event);

    expect(redis.publish).not.toHaveBeenCalled();
  });
});
