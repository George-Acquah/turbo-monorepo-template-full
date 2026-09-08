import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import type { FileUploadRepositoryPort, StoragePort } from '@workspace/ports';
import type { StorageRuntimeConfig } from '@workspace/ports/config';
import { createMock } from '@workspace/testing/jest';
import { CreateUploadIntentUseCase } from '../../../../src/application/uploads/use-cases/create-upload-intent.use-case';

describe('CreateUploadIntentUseCase', () => {
  let fileUploadRepo: ReturnType<typeof createMock<Pick<FileUploadRepositoryPort, 'create'>>>;
  let storage: { getUploadUrl: ReturnType<typeof jest.fn> };
  let storageConfig: StorageRuntimeConfig;
  let useCase: CreateUploadIntentUseCase;

  beforeEach(() => {
    fileUploadRepo = createMock(['create']);
    storage = { getUploadUrl: jest.fn() };
    storageConfig = { defaultBucket: 'tp-media', s3: {} } as never;
    useCase = new CreateUploadIntentUseCase(
      fileUploadRepo as unknown as FileUploadRepositoryPort,
      storage as unknown as StoragePort,
      storageConfig,
    );
  });

  it('rejects a mime type not allowed for the purpose', async () => {
    await expect(
      useCase.execute({ purpose: 'AVATAR', mimeType: 'video/mp4', sizeBytes: 1000 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fileUploadRepo.create).not.toHaveBeenCalled();
  });

  it('rejects a size exceeding the purpose limit', async () => {
    await expect(
      useCase.execute({ purpose: 'AVATAR', mimeType: 'image/png', sizeBytes: 10 * 1024 * 1024 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-positive size', async () => {
    await expect(
      useCase.execute({ purpose: 'AVATAR', mimeType: 'image/png', sizeBytes: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('builds a purpose-scoped object key and returns the presigned URL', async () => {
    fileUploadRepo.create.mockResolvedValue({
      id: 'flu_1',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    } as never);
    storage.getUploadUrl.mockResolvedValue({
      url: 'https://example.com/presigned',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    });

    const result = await useCase.execute({
      purpose: 'RESOURCE',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      profileId: 'prf_1',
    });

    expect(fileUploadRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: 'prf_1',
        userId: null,
        expectedMime: 'application/pdf',
        expectedBytes: 1024,
        bucket: 'tp-media',
        purpose: 'RESOURCE',
        objectKey: expect.stringMatching(/^resources\/prf_1\/.+\.pdf$/),
      }),
    );
    expect(result).toEqual({
      uploadId: 'flu_1',
      presignedUrl: 'https://example.com/presigned',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    });
  });

  it('routes a PUBLIC-visibility purpose (AVATAR) to the configured public bucket', async () => {
    storageConfig = { defaultBucket: 'tp-media', s3: { publicBucket: 'tp-public' } } as never;
    useCase = new CreateUploadIntentUseCase(
      fileUploadRepo as unknown as FileUploadRepositoryPort,
      storage as unknown as StoragePort,
      storageConfig,
    );
    fileUploadRepo.create.mockResolvedValue({
      id: 'flu_2',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    } as never);
    storage.getUploadUrl.mockResolvedValue({
      url: 'https://example.com/presigned',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    });

    await useCase.execute({ purpose: 'AVATAR', mimeType: 'image/png', sizeBytes: 1024, profileId: 'prf_1' });

    expect(fileUploadRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: 'tp-public' }),
    );
  });

  it('falls back to the default bucket for AVATAR when no public bucket is configured', async () => {
    fileUploadRepo.create.mockResolvedValue({
      id: 'flu_3',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    } as never);
    storage.getUploadUrl.mockResolvedValue({
      url: 'https://example.com/presigned',
      expiresAt: new Date('2026-01-01T00:15:00.000Z'),
    });

    await useCase.execute({ purpose: 'AVATAR', mimeType: 'image/png', sizeBytes: 1024, profileId: 'prf_1' });

    expect(fileUploadRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: 'tp-media' }),
    );
  });
});
