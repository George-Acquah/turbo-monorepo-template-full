import { describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type {
  ApiClientRepositoryPort,
  ApiKeyRepositoryPort,
  EventPublisherPort,
  HashPort,
  TransactionPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { CreateApiKeyUseCase } from '../../../../src/application/api-keys/use-cases/create-api-key.use-case';

describe('CreateApiKeyUseCase', () => {
  let apiKeyRepo: ReturnType<typeof createMock<Pick<ApiKeyRepositoryPort, 'create'>>>;
  let apiClientRepo: ReturnType<typeof createMock<Pick<ApiClientRepositoryPort, 'findById'>>>;
  let hashPort: ReturnType<typeof createMock<Pick<HashPort, 'hashToken' | 'generateSecureToken'>>>;
  let publisher: ReturnType<typeof createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>>;
  let transactionPort: ReturnType<typeof createMock<Pick<TransactionPort, 'execute'>>>;
  let useCase: CreateApiKeyUseCase;

  beforeEach(() => {
    apiKeyRepo = createMock<Pick<ApiKeyRepositoryPort, 'create'>>(['create']);
    apiClientRepo = createMock<Pick<ApiClientRepositoryPort, 'findById'>>(['findById']);
    hashPort = createMock<Pick<HashPort, 'hashToken' | 'generateSecureToken'>>([
      'hashToken',
      'generateSecureToken',
    ]);
    hashPort.hashToken.mockResolvedValue('hashed-key');
    hashPort.generateSecureToken.mockResolvedValue('raw-generated-key');
    publisher = createMock<Pick<EventPublisherPort, 'publishWithTransaction'>>([
      'publishWithTransaction',
    ]);
    transactionPort = createMock<Pick<TransactionPort, 'execute'>>(['execute']);
    transactionPort.execute.mockImplementation(((op: (tx: unknown) => unknown) =>
      op(undefined)) as never);

    useCase = new CreateApiKeyUseCase(
      apiKeyRepo as unknown as ApiKeyRepositoryPort,
      apiClientRepo as unknown as ApiClientRepositoryPort,
      hashPort as unknown as HashPort,
      publisher as unknown as EventPublisherPort,
      transactionPort as unknown as TransactionPort,
    );
  });

  it('rejects when the API client does not exist', async () => {
    apiClientRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ apiClientId: 'acl_missing', name: 'key', scopes: ['catalog:read'] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when the API client is not active', async () => {
    apiClientRepo.findById.mockResolvedValue({ id: 'acl_1', status: 'SUSPENDED' } as never);

    await expect(
      useCase.execute({ apiClientId: 'acl_1', name: 'key', scopes: ['catalog:read'] }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(apiKeyRepo.create).not.toHaveBeenCalled();
  });

  it('mints a key, hashes it, persists the hash, and returns the raw key exactly once', async () => {
    apiClientRepo.findById.mockResolvedValue({ id: 'acl_1', status: 'ACTIVE' } as never);
    apiKeyRepo.create.mockImplementation(((data: Record<string, unknown>) =>
      Promise.resolve({ ...data, apiClientId: 'acl_1' })) as never);

    const result = await useCase.execute({
      apiClientId: 'acl_1',
      name: 'Production key',
      scopes: ['catalog:read'],
    });

    expect(hashPort.hashToken).toHaveBeenCalledWith(result.apiKey);
    expect(apiKeyRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^aky_/),
        apiClientId: 'acl_1',
        name: 'Production key',
        keyHash: 'hashed-key',
        scopes: ['catalog:read'],
      }),
      undefined,
    );
    // The raw key is never the same as what was persisted.
    expect(result.apiKey).not.toBe('hashed-key');
    expect(result.keyPrefix).toBe(result.apiKey.slice(0, result.keyPrefix.length));
    expect(publisher.publishWithTransaction).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ eventType: 'workspace.identity.api_key.created' }),
    );
  });
});
