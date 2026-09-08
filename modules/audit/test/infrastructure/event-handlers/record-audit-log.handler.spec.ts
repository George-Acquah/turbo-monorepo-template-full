import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthEvents, BillingEvents } from '@workspace/types';
import { RecordAuditLogHandler } from '../../../src/infrastructure/event-handlers/record-audit-log.handler';
import type { AuditCommandPort } from '@workspace/ports';

describe('RecordAuditLogHandler', () => {
  let auditCommand: { createAuditLog: ReturnType<typeof jest.fn> };
  let handler: RecordAuditLogHandler;

  beforeEach(() => {
    auditCommand = { createAuditLog: jest.fn().mockResolvedValue({ id: 'aud_1' }) };
    handler = new RecordAuditLogHandler(auditCommand as unknown as AuditCommandPort);
  });

  it('supports every event type — the one legitimate wildcard consumer', () => {
    expect(handler.supports(AuthEvents.USER_REGISTERED)).toBe(true);
    expect(handler.supports(BillingEvents.PAYMENT_SUCCEEDED)).toBe(true);
    expect(handler.supports('workspace.made.up.event' as never)).toBe(true);
  });

  it('maps the envelope directly onto AuditLogInput without forcing a closed action/entityType vocabulary', async () => {
    await handler.handle({
      eventId: 'obe_1',
      eventType: BillingEvents.PAYMENT_SUCCEEDED,
      aggregateType: 'PAYMENT',
      aggregateId: 'pay_1',
      schemaVersion: 1,
      occurredAt: '2026-07-18T00:00:00.000Z',
      enqueuedAt: '2026-07-18T00:00:00.000Z',
      actor: { type: 'system', userId: 'usr_1', ipAddress: '1.2.3.4', userAgent: 'jest' },
      trace: { requestId: 'req_1', correlationId: 'corr_1' },
      causationId: 'obe_0',
      retryCount: 0,
      payload: { paymentId: 'pay_1', amountMinor: 1000, currency: 'GHS' },
    } as never);

    expect(auditCommand.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'PAYMENT',
        entityId: 'pay_1',
        action: BillingEvents.PAYMENT_SUCCEEDED,
        actorId: 'usr_1',
        actorType: 'system',
        ipAddress: '1.2.3.4',
        userAgent: 'jest',
        requestId: 'req_1',
        correlationId: 'corr_1',
        newValues: { paymentId: 'pay_1', amountMinor: 1000, currency: 'GHS' },
      }),
    );
  });
});
