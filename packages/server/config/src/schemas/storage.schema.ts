import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import {
  toBooleanWithDefault,
  toOptionalString,
  toStorageProviderWithDefault,
  toStringWithDefault,
} from '@/env.transforms';
import { STORAGE_PROVIDERS, type StorageRuntimeConfig } from '@workspace/ports/config';

export class StorageEnvSchema {
  @Transform(toStorageProviderWithDefault('local'))
  @IsIn(STORAGE_PROVIDERS)
  STORAGE_PROVIDER: (typeof STORAGE_PROVIDERS)[number] = 'local';

  @Transform(toStringWithDefault('uploads'))
  @IsString()
  STORAGE_DEFAULT_BUCKET = 'uploads';

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  STORAGE_PUBLIC_BASE_URL?: string;

  @Transform(toStringWithDefault('.data/storage'))
  @IsString()
  STORAGE_LOCAL_ROOT = '.data/storage';

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  STORAGE_S3_ENDPOINT?: string;

  @Transform(toStringWithDefault('auto'))
  @IsString()
  STORAGE_S3_REGION = 'auto';

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  STORAGE_S3_ACCESS_KEY_ID?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  STORAGE_S3_SECRET_ACCESS_KEY?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  STORAGE_S3_BUCKET?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  STORAGE_S3_PUBLIC_BUCKET?: string;

  @Transform(toBooleanWithDefault(false))
  @IsBoolean()
  STORAGE_S3_FORCE_PATH_STYLE = false;
}

export function createStorageConfig(schema: StorageEnvSchema): StorageRuntimeConfig {
  return {
    provider: schema.STORAGE_PROVIDER,
    defaultBucket: schema.STORAGE_DEFAULT_BUCKET,
    publicBaseUrl: schema.STORAGE_PUBLIC_BASE_URL,
    local: {
      rootPath: schema.STORAGE_LOCAL_ROOT,
    },
    s3: {
      endpoint: schema.STORAGE_S3_ENDPOINT,
      region: schema.STORAGE_S3_REGION,
      accessKeyId: schema.STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: schema.STORAGE_S3_SECRET_ACCESS_KEY,
      bucket: schema.STORAGE_S3_BUCKET,
      publicBucket: schema.STORAGE_S3_PUBLIC_BUCKET,
      forcePathStyle: schema.STORAGE_S3_FORCE_PATH_STYLE,
    },
  };
}
