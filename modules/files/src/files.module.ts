import { Module } from '@nestjs/common';
import { FilesPersistenceModule } from '@workspace/files-persistence';
import { StorageModule } from '@workspace/storage';
import { ProfileContextModule } from '@workspace/profile-context';
import { FilesApplicationPortModule } from './files-application-port.module';
import { CreateUploadIntentUseCase } from './application/uploads/use-cases/create-upload-intent.use-case';
import { CompleteUploadUseCase } from './application/uploads/use-cases/complete-upload.use-case';
import { FilesController } from './presentation/controllers/files.controller';

/**
 * Composition root for the files bounded-context module (doc 03 §2.11) —
 * the upload-intent → complete → signed-URL-serving primitive both
 * `modules/learning` (lesson video) and a future events replay flow need.
 *
 * `FilesApplicationPortModule` (the cross-context seam other modules use)
 * is a separate, `@Global()` sub-module — imported here so this module's own
 * graph also has it available, same pattern as `BillingApplicationPortModule`.
 */
@Module({
  imports: [FilesPersistenceModule, StorageModule, ProfileContextModule, FilesApplicationPortModule],
  controllers: [FilesController],
  providers: [CreateUploadIntentUseCase, CompleteUploadUseCase],
})
export class FilesModule {}
