import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { toStringWithDefault } from '@/env.transforms';
import type { CaptchaRuntimeConfig } from '@workspace/ports/config';

export class CaptchaEnvSchema {
  @Transform(toStringWithDefault(''))
  @IsString()
  TURNSTILE_SECRET_KEY = '';
}

export function createCaptchaConfig(schema: CaptchaEnvSchema): CaptchaRuntimeConfig {
  return {
    turnstileSecretKey: schema.TURNSTILE_SECRET_KEY,
  };
}
