import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { FileRecordRepositoryPort, StoragePort } from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { FilesApplicationService } from '../../../src/application/application-port/files-application.service';

describe('FilesApplicationService', () => {
  let fileRecordRepo: ReturnType<typeof createMock<Pick<FileRecordRepositoryPort, 'findById'>>>;
  let storage: { getDownloadUrl: ReturnType<typeof jest.fn> };
  let service: FilesApplicationService;

  beforeEach(() => {
    fileRecordRepo = createMock(['findById']);
    storage = { getDownloadUrl: jest.fn() };
    service = new FilesApplicationService(
      fileRecordRepo as unknown as FileRecordRepositoryPort,
      storage as unknown as StoragePort,
    );
  });

  it('returns null when the file does not exist', async () => {
    fileRecordRepo.findById.mockResolvedValue(null);

    const result = await service.getSignedUrlForFile('fil_1');

    expect(result).toBeNull();
    expect(storage.getDownloadUrl).not.toHaveBeenCalled();
  });

  it('returns null when the file has been soft-deleted', async () => {
    fileRecordRepo.findById.mockResolvedValue({
      id: 'fil_1',
      deletedAt: new Date(),
    } as never);

    const result = await service.getSignedUrlForFile('fil_1');

    expect(result).toBeNull();
  });

  it('resolves a signed URL for an existing, non-deleted file', async () => {
    fileRecordRepo.findById.mockResolvedValue({
      id: 'fil_1',
      deletedAt: null,
      bucket: 'tp-media',
      objectKey: 'lessons/crs_1/video.mp4',
    } as never);
    storage.getDownloadUrl.mockResolvedValue({ url: 'https://example.com/signed', expiresAt: new Date() });

    const result = await service.getSignedUrlForFile('fil_1');

    expect(storage.getDownloadUrl).toHaveBeenCalledWith({
      bucket: 'tp-media',
      key: 'lessons/crs_1/video.mp4',
    });
    expect(result).toEqual(expect.objectContaining({ url: 'https://example.com/signed' }));
  });
});
