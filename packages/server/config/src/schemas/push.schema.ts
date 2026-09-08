import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { toStringWithDefault } from '@/env.transforms';
import type { PushRuntimeConfig } from '@workspace/ports/config';

/**
 * Standard Firebase service-account triple, one env var each — easier to set
 * in `.env` than a multi-line JSON blob.
 */
export class PushEnvSchema {
  @Transform(toStringWithDefault(''))
  @IsString()
  FCM_PROJECT_ID = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  FCM_CLIENT_EMAIL = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  FCM_PRIVATE_KEY = '';
}

export function createPushConfig(schema: PushEnvSchema): PushRuntimeConfig {
  return {
    fcmProjectId: schema.FCM_PROJECT_ID,
    fcmClientEmail: schema.FCM_CLIENT_EMAIL,
    // .env files can't hold real newlines in a single-line value — service
    // account keys are commonly stored with escaped \n sequences.
    fcmPrivateKey: schema.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
}
