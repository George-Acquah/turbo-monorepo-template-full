import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { toStringWithDefault } from '@/env.transforms';
import type { EncryptionRuntimeConfig } from '@workspace/ports/config';

export class EncryptionEnvSchema {
  @Transform(toStringWithDefault(''))
  @IsString()
  ENCRYPTION_KEY = '';
}

export function createEncryptionConfig(schema: EncryptionEnvSchema): EncryptionRuntimeConfig {
  return {
    key: schema.ENCRYPTION_KEY,
  };
}
