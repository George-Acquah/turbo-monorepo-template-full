import { Module } from '@nestjs/common';
import { PrismaModule } from '@workspace/prisma';
import { FileRecordQuery, FileUploadQuery } from './queries';
import { FILES_PERSISTENCE_ADAPTERS, FILES_PERSISTENCE_TOKENS } from './providers';

export * from './queries';
export * from './converter';
export * from './adapters';

/**
 * Implements the workspace_files ports (FileRecord, FileUpload) against
 * Prisma. The binary never lives here — only the storage pointer, checksum,
 * and scan status. FileUpload is the presigned-intent row, finalised into a
 * FileRecord via markConsumed once the client's PUT completes.
 */
@Module({
  imports: [PrismaModule],
  providers: [FileRecordQuery, FileUploadQuery, ...FILES_PERSISTENCE_ADAPTERS],
  exports: [...FILES_PERSISTENCE_TOKENS],
})
export class FilesPersistenceModule {}
