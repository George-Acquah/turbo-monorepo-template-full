export interface SignedFileUrl {
  url: string;
  expiresAt?: Date;
}

/**
 * The sanctioned seam for another context to resolve a `FileRecord` to a
 * signed URL without importing `ports/database/schema/files/**` directly.
 * Implemented by `modules/files` (`FilesApplicationService`), consumed by
 * `modules/learning`'s lesson/replay endpoints (`videoFileId` → playable
 * URL). Authorization (does the caller have access to the *resource* this
 * file belongs to — a lesson, a replay) is the caller's responsibility; this
 * port only resolves the URL for an already-authorized request.
 */
export abstract class FilesApplicationPort {
  abstract getSignedUrlForFile(fileId: string): Promise<SignedFileUrl | null>;
}
