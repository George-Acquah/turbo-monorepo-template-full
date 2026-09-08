import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type {
  FileUploadRepositoryPort,
  FileRecordRepositoryPort,
  StoragePort,
  EventPublisherPort,
  QueueBusPort,
} from '@workspace/ports';
import type { StorageRuntimeConfig } from '@workspace/ports/config';
import { createMock } from '@workspace/testing/jest';
import { CompleteUploadUseCase } from '../../../../src/application/uploads/use-cases/complete-upload.use-case';

describe('CompleteUploadUseCase', () => {
  let fileUploadRepo: ReturnType<
    typeof createMock<Pick<FileUploadRepositoryPort, 'findById' | 'update' | 'markConsumed'>>
  >;
  let fileRecordRepo: ReturnType<typeof createMock<Pick<FileRecordRepositoryPort, 'create'>>>;
  let storage: { exists: ReturnType<typeof jest.fn> };
  let storageConfig: StorageRuntimeConfig;
  let publisher: { publish: ReturnType<typeof jest.fn>; publishWithTransaction: ReturnType<typeof jest.fn> };
  let queueBus: { enqueue: ReturnType<typeof jest.fn> };
  let useCase: CompleteUploadUseCase;

  beforeEach(() => {
    fileUploadRepo = createMock(['findById', 'update', 'markConsumed']);
    fileRecordRepo = createMock(['create']);
    storage = { exists: jest.fn() };
    storageConfig = { provider: 'local' } as never;
    publisher = { publish: jest.fn(), publishWithTransaction: jest.fn() };
    queueBus = { enqueue: jest.fn() };

    useCase = new CompleteUploadUseCase(
      fileUploadRepo as unknown as FileUploadRepositoryPort,
      fileRecordRepo as unknown as FileRecordRepositoryPort,
      storage as unknown as StoragePort,
      storageConfig,
      publisher as unknown as EventPublisherPort,
      queueBus as unknown as QueueBusPort,
    );
  });

  it('404s when the upload does not exist', async () => {
    fileUploadRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ uploadId: 'flu_1', profileId: 'prf_1' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a caller who does not own the upload', async () => {
    fileUploadRepo.findById.mockResolvedValue({
      id: 'flu_1',
      profileId: 'prf_owner',
      userId: null,
      status: 'PENDING',
    } as never);

    await expect(
      useCase.execute({ uploadId: 'flu_1', profileId: 'prf_other' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('is idempotent on redelivery of an already-consumed upload', async () => {
    fileUploadRepo.findById.mockResolvedValue({
      id: 'flu_1',
      profileId: 'prf_1',
      status: 'CONSUMED',
      fileId: 'fil_1',
    } as never);

    const result = await useCase.execute({ uploadId: 'flu_1', profileId: 'prf_1' });

    expect(result).toEqual({ fileId: 'fil_1' });
    expect(fileRecordRepo.create).not.toHaveBeenCalled();
  });

  it('rejects an expired upload', async () => {
    fileUploadRepo.findById.mockResolvedValue({
      id: 'flu_1',
      profileId: 'prf_1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 1000),
    } as never);

    await expect(
      useCase.execute({ uploadId: 'flu_1', profileId: 'prf_1' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(fileUploadRepo.update).toHaveBeenCalledWith('flu_1', { status: 'EXPIRED' });
  });

  it('rejects when the object was never actually uploaded to storage', async () => {
    fileUploadRepo.findById.mockResolvedValue({
      id: 'flu_1',
      profileId: 'prf_1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
      bucket: 'tp-media',
      objectKey: 'resources/prf_1/file.pdf',
    } as never);
    storage.exists.mockResolvedValue(false);

    await expect(
      useCase.execute({ uploadId: 'flu_1', profileId: 'prf_1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates the FileRecord, marks consumed, publishes FILE_UPLOADED, and enqueues the scan job', async () => {
    fileUploadRepo.findById.mockResolvedValue({
      id: 'flu_1',
      profileId: 'prf_1',
      userId: null,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
      bucket: 'tp-media',
      objectKey: 'resources/prf_1/file.pdf',
      expectedMime: 'application/pdf',
      expectedBytes: 1024,
      purpose: 'RESOURCE',
    } as never);
    storage.exists.mockResolvedValue(true);
    fileRecordRepo.create.mockResolvedValue({
      id: 'fil_1',
      ownerProfileId: 'prf_1',
      uploadedByUserId: null,
      purpose: 'RESOURCE',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      checksumSha256: null,
      bucket: 'tp-media',
      objectKey: 'resources/prf_1/file.pdf',
    } as never);

    const result = await useCase.execute({ uploadId: 'flu_1', profileId: 'prf_1' });

    expect(fileUploadRepo.markConsumed).toHaveBeenCalledWith('flu_1', 'fil_1');
    expect(fileRecordRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: 'PRIVATE' }),
    );
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'workspace.files.file.uploaded',
        payload: expect.objectContaining({ fileId: 'fil_1', uploadId: 'flu_1' }),
      }),
    );
    expect(queueBus.enqueue).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { fileId: 'fil_1' },
    );
    expect(result).toEqual({ fileId: 'fil_1' });
  });

  it('marks an AVATAR upload PUBLIC on the resulting FileRecord', async () => {
    fileUploadRepo.findById.mockResolvedValue({
      id: 'flu_2',
      profileId: 'prf_1',
      userId: null,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
      bucket: 'tp-public',
      objectKey: 'avatars/prf_1/file.png',
      expectedMime: 'image/png',
      expectedBytes: 1024,
      purpose: 'AVATAR',
    } as never);
    storage.exists.mockResolvedValue(true);
    fileRecordRepo.create.mockResolvedValue({ id: 'fil_2' } as never);

    await useCase.execute({ uploadId: 'flu_2', profileId: 'prf_1' });

    expect(fileRecordRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: 'PUBLIC' }),
    );
  });
});
