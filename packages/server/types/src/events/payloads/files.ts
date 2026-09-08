import { FilePurpose } from '@workspace/constants';
import { FilesEvents } from '../domain-events.constants';

// scanStatus is a real async state machine (PENDING→CLEAN|INFECTED). Binaries
// never appear in payloads — only the pointer, checksum, and classification.

// export type FilePurpose =
//   | 'LESSON_VIDEO'
//   | 'REPLAY_VIDEO'
//   | 'RESOURCE'
//   | 'RECEIPT_PDF'
//   | 'AVATAR'
//   | 'OTHER';

export interface FileUploadedPayload {
  readonly fileId: string;
  readonly uploadId?: string;
  readonly ownerProfileId?: string;
  readonly uploadedByUserId?: string;
  readonly purpose: FilePurpose;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly checksumSha256?: string;
  readonly bucket: string;
  readonly objectKey: string;
}

export interface ScanCompletedPayload {
  readonly fileId: string;
  readonly purpose: FilePurpose;
}

export interface ScanInfectedPayload {
  readonly fileId: string;
  readonly purpose: FilePurpose;
}

export interface FileProcessedPayload {
  readonly fileId: string;
  readonly purpose: FilePurpose;
}

export interface FileDeletedPayload {
  readonly fileId: string;
  readonly purpose: FilePurpose;
  readonly deletedAt: string;
}

export interface FilesEventsMap {
  [FilesEvents.FILE_UPLOADED]: FileUploadedPayload;
  [FilesEvents.SCAN_COMPLETED]: ScanCompletedPayload;
  [FilesEvents.SCAN_INFECTED]: ScanInfectedPayload;
  [FilesEvents.FILE_PROCESSED]: FileProcessedPayload;
  [FilesEvents.FILE_DELETED]: FileDeletedPayload;
}
