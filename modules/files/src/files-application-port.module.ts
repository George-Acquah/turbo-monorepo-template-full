import { Global, Module } from '@nestjs/common';
import { FilesPersistenceModule } from '@workspace/files-persistence';
import { StorageModule } from '@workspace/storage';
import { FILES_APPLICATION_TOKEN } from '@workspace/ports';
import { FilesApplicationService } from './application/application-port/files-application.service';

/**
 * Global sub-module exposing `FilesApplicationPort` (bound to
 * `FILES_APPLICATION_TOKEN`) to the whole app — the sanctioned way for
 * another `modules/{context}` package (`modules/learning`'s lesson/replay
 * endpoints) to resolve a `videoFileId` to a signed URL without importing
 * `ports/database/schema/files/**` directly. Same pattern as
 * `CatalogApplicationPortModule`/`EnrolmentsApplicationPortModule`.
 *
 * Imports `FilesPersistenceModule`/`StorageModule` directly — sibling
 * imports under the same parent module don't share providers in Nest.
 */
@Global()
@Module({
  imports: [FilesPersistenceModule, StorageModule],
  providers: [
    FilesApplicationService,
    { provide: FILES_APPLICATION_TOKEN, useExisting: FilesApplicationService },
  ],
  exports: [FILES_APPLICATION_TOKEN],
})
export class FilesApplicationPortModule {}
