import { FilePurpose } from './file-record.constants';

export const MimeTypes = {
  JSON: 'application/json',
  PDF: 'application/pdf',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  GIF: 'image/gif',
  CSV: 'text/csv',
  TXT: 'text/plain',
  ZIP: 'application/zip',
  MP4: 'video/mp4',
  WEBM: 'video/webm',
} as const;

export type MimeType = (typeof MimeTypes)[keyof typeof MimeTypes];

const MB = 1024 * 1024;
const GB = 1024 * MB;

/**
 * Per-`FilePurpose` upload allowlist/size-limit enforcement — the table
 * `create-upload-intent.use-case.ts` validates every intent against.
 * `LESSON_VIDEO`/`REPLAY_VIDEO`/`RESOURCE`/`AVATAR` limits are doc 09 §1's
 * exact spec. `RECEIPT_PDF`/`OTHER` aren't spelled out there (receipts are
 * system-generated, not uploaded through this intent flow, but the type
 * still needs an entry) — reasonable defaults, flagged the same way as
 * other placeholder values pending business sign-off (doc 13).
 */
export const FilePurposeConstraints: Record<
  FilePurpose,
  { allowedMimeTypes: MimeType[]; maxSizeBytes: number }
> = {
  [FilePurpose.LESSON_VIDEO]: { allowedMimeTypes: [MimeTypes.MP4, MimeTypes.WEBM], maxSizeBytes: 4 * GB },
  [FilePurpose.REPLAY_VIDEO]: { allowedMimeTypes: [MimeTypes.MP4, MimeTypes.WEBM], maxSizeBytes: 4 * GB },
  [FilePurpose.RESOURCE]: {
    allowedMimeTypes: [MimeTypes.PDF, MimeTypes.ZIP, MimeTypes.PNG],
    maxSizeBytes: 50 * MB,
  },
  [FilePurpose.RECEIPT_PDF]: { allowedMimeTypes: [MimeTypes.PDF], maxSizeBytes: 10 * MB },
  [FilePurpose.AVATAR]: {
    allowedMimeTypes: [MimeTypes.PNG, MimeTypes.JPEG, MimeTypes.GIF],
    maxSizeBytes: 2 * MB,
  },
  [FilePurpose.OTHER]: {
    allowedMimeTypes: [MimeTypes.PDF, MimeTypes.PNG, MimeTypes.JPEG, MimeTypes.ZIP],
    maxSizeBytes: 50 * MB,
  },
};
