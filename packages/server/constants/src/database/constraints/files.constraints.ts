import { enumConstraint, numericConstraint } from '../builders';
import { Schemas, Tables } from '../postgres.constants';
import {
  FileScanStatus,
  FilePurpose,
  FileUploadStatus,
  FileVisibility,
  StorageProviders,
} from '../../storage';

export const FilesConstraints = [
  // storage_provider is narrower than the full StorageProviders set —
  // 'supabase' has no adapter implemented, so it isn't allowed at the DB
  // level yet (matches files.prisma's check exactly).
  enumConstraint({
    schema: Schemas.FILES,
    table: Tables.FILE_RECORDS,
    column: 'storage_provider',
    values: [StorageProviders.LOCAL, StorageProviders.S3, StorageProviders.R2],
  }),
  numericConstraint({
    schema: Schemas.FILES,
    table: Tables.FILE_RECORDS,
    column: 'size_bytes',
    min: 0,
  }),
  enumConstraint({
    schema: Schemas.FILES,
    table: Tables.FILE_RECORDS,
    column: 'visibility',
    values: FileVisibility,
  }),
  enumConstraint({
    schema: Schemas.FILES,
    table: Tables.FILE_RECORDS,
    column: 'scan_status',
    values: FileScanStatus,
  }),
  enumConstraint({
    schema: Schemas.FILES,
    table: Tables.FILE_RECORDS,
    column: 'purpose',
    values: FilePurpose,
    name: 'chk_file_records_purpose',
  }),
  enumConstraint({
    schema: Schemas.FILES,
    table: Tables.FILE_UPLOADS,
    column: 'purpose',
    values: FilePurpose,
    name: 'chk_file_uploads_purpose',
  }),
  enumConstraint({
    schema: Schemas.FILES,
    table: Tables.FILE_UPLOADS,
    column: 'status',
    values: FileUploadStatus,
  }),
] as const;
