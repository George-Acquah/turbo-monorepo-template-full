import { FileVisibility } from './file-visibility.constants';
import { FilePurpose } from './file-record.constants';

/**
 * Which `FileVisibility` — and therefore which bucket (public vs private,
 * see `StorageRuntimeConfig.s3.publicBucket`) — each `FilePurpose` lands in.
 * `AVATAR` is the only purpose served over a public custom domain today;
 * everything else (paid lesson/replay video, resources, receipts) stays
 * private and is only ever served through a signed URL.
 */
export const FilePurposeVisibility: Record<FilePurpose, FileVisibility> = {
  [FilePurpose.LESSON_VIDEO]: FileVisibility.PRIVATE,
  [FilePurpose.REPLAY_VIDEO]: FileVisibility.PRIVATE,
  [FilePurpose.RESOURCE]: FileVisibility.PRIVATE,
  [FilePurpose.RECEIPT_PDF]: FileVisibility.PRIVATE,
  [FilePurpose.AVATAR]: FileVisibility.PUBLIC,
  [FilePurpose.OTHER]: FileVisibility.PRIVATE,
};
