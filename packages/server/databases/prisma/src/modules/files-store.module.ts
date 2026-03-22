import { Global, Module } from '@nestjs/common';
import { FILE_RECORD_STORE_TOKEN, FILE_UPLOAD_STORE_TOKEN } from '@repo/ports';
import {
  PrismaFileRecordStoreAdapter,
  PrismaFileUploadStoreAdapter,
} from '../adapters/files';

@Global()
@Module({
  providers: [
    PrismaFileRecordStoreAdapter,
    PrismaFileUploadStoreAdapter,
    { provide: FILE_RECORD_STORE_TOKEN, useExisting: PrismaFileRecordStoreAdapter },
    { provide: FILE_UPLOAD_STORE_TOKEN, useExisting: PrismaFileUploadStoreAdapter },
  ],
  exports: [FILE_RECORD_STORE_TOKEN, FILE_UPLOAD_STORE_TOKEN],
})
export class PrismaFilesStoreModule {}
