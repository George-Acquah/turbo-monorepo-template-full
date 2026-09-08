import { FilesEvents } from '@workspace/types';

/**
 * Events this module PRODUCES — enforced by the `workspace/event-ownership`
 * ESLint rule. Only `FILE_UPLOADED` (from `CompleteUploadUseCase`) is
 * emitted this pass — the scan-pipeline events (`SCAN_COMPLETED`/
 * `SCAN_INFECTED`/`FILE_PROCESSED`/`FILE_DELETED`) stay undeclared, no
 * producing path yet (real AV scanning is out of scope — see
 * `process-file-upload.processor.ts`'s doc comment).
 */
type FilesEventType = (typeof FilesEvents)[keyof typeof FilesEvents];
export const filesProduces: FilesEventType[] = [FilesEvents.FILE_UPLOADED];
