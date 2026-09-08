import { describe, it, expect, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import type {
  ConsentRecordRepositoryPort,
  EventPublisherPort,
  MemberProfileRepositoryPort,
  TransactionPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { RecordConsentUseCase } from '../../../../src/application/consent/use-cases/record-consent.use-case';

describe('RecordConsentUseCase', () => {
  let memberProfileRepo: ReturnType<typeof createMock<Pick<MemberProfileRepositoryPort, 'findByUserId'>>>;
  let consentRepo: ReturnType<typeof createMock<Pick<ConsentRecordRepositoryPort, 'create'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let useCase: RecordConsentUseCase;

  beforeEach(() => {
    memberProfileRepo = createMock<Pick<MemberProfileRepositoryPort, 'findByUserId'>>([
      'findByUserId',
    ]);
    consentRepo = createMock<Pick<ConsentRecordRepositoryPort, 'create'>>(['create']);
    publisher = createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>([
      'publishWithTransaction',
    ]);
    transactionPort = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) =>
      op(undefined)) as never);

    useCase = new RecordConsentUseCase(
      memberProfileRepo as unknown as MemberProfileRepositoryPort,
      consentRepo as unknown as ConsentRecordRepositoryPort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
    );
  });

  it('throws NotFound when the user has no linked profile', async () => {
    memberProfileRepo.findByUserId.mockResolvedValue(null);

    await expect(
      useCase.execute('usr_staff', { kind: 'TERMS_OF_SERVICE' as never, version: 'v1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('records a granted consent and publishes CONSENT_GRANTED', async () => {
    memberProfileRepo.findByUserId.mockResolvedValue({ id: 'prf_1' } as never);
    consentRepo.create.mockResolvedValue({ id: 'cns_1', granted: true } as never);

    const result = await useCase.execute('usr_1', {
      kind: 'TERMS_OF_SERVICE' as never,
      version: 'tos-2026-06',
      ipAddress: '1.2.3.4',
    });

    expect(consentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: 'prf_1', granted: true, version: 'tos-2026-06' }),
      undefined,
    );
    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ eventType: 'workspace.profiles.consent.granted' }),
    );
    expect(result.granted).toBe(true);
  });
});
