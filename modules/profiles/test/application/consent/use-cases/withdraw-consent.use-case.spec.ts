import { describe, it, expect, beforeEach } from '@jest/globals';
import type {
  ConsentRecordRepositoryPort,
  EventPublisherPort,
  MemberProfileRepositoryPort,
  TransactionPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { WithdrawConsentUseCase } from '../../../../src/application/consent/use-cases/withdraw-consent.use-case';

describe('WithdrawConsentUseCase', () => {
  let memberProfileRepo: ReturnType<typeof createMock<Pick<MemberProfileRepositoryPort, 'findByUserId'>>>;
  let consentRepo: ReturnType<typeof createMock<Pick<ConsentRecordRepositoryPort, 'create'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let useCase: WithdrawConsentUseCase;

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

    useCase = new WithdrawConsentUseCase(
      memberProfileRepo as unknown as MemberProfileRepositoryPort,
      consentRepo as unknown as ConsentRecordRepositoryPort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
    );
  });

  it('records a withdrawn (granted:false) consent and publishes CONSENT_WITHDRAWN', async () => {
    memberProfileRepo.findByUserId.mockResolvedValue({ id: 'prf_1' } as never);
    consentRepo.create.mockResolvedValue({ id: 'cns_2', granted: false } as never);

    const result = await useCase.execute('usr_1', {
      kind: 'MARKETING_EMAIL' as never,
      version: 'v1',
    });

    expect(consentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: 'prf_1', granted: false }),
      undefined,
    );
    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ eventType: 'workspace.profiles.consent.withdrawn' }),
    );
    expect(result.granted).toBe(false);
  });
});
