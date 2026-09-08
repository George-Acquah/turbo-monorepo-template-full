import type { Provider } from '@nestjs/common';
import type { ValidatedServerEnv } from './types';

import {
  VALIDATED_ENV_TOKEN,
  APP_RUNTIME_CONFIG_TOKEN,
  HTTP_RUNTIME_CONFIG_TOKEN,
  CONTEXT_RUNTIME_CONFIG_TOKEN,
  PERSISTENCE_RUNTIME_CONFIG_TOKEN,
  MONGO_RUNTIME_CONFIG_TOKEN,
  PRISMA_RUNTIME_CONFIG_TOKEN,
  REDIS_RUNTIME_CONFIG_TOKEN,
  AUTH_RUNTIME_CONFIG_TOKEN,
  GOOGLE_OAUTH_RUNTIME_CONFIG_TOKEN,
  GITHUB_OAUTH_RUNTIME_CONFIG_TOKEN,
  OBSERVABILITY_RUNTIME_CONFIG_TOKEN,
  STORAGE_RUNTIME_CONFIG_TOKEN,
  BRANDING_RUNTIME_CONFIG_TOKEN,
  CORS_RUNTIME_CONFIG_TOKEN,
  EMAIL_RUNTIME_CONFIG_TOKEN,
  WHATSAPP_RUNTIME_CONFIG_TOKEN,
  SMS_RUNTIME_CONFIG_TOKEN,
  PUSH_RUNTIME_CONFIG_TOKEN,
  PAYMENT_PROVIDERS_RUNTIME_CONFIG_TOKEN,
  ENCRYPTION_RUNTIME_CONFIG_TOKEN,
  CAPTCHA_RUNTIME_CONFIG_TOKEN,
} from '@workspace/ports/config';

import type {
  AppRuntimeConfig,
  AuthRuntimeConfig,
  BrandingRuntimeConfig,
  CaptchaRuntimeConfig,
  ContextRuntimeConfig,
  CorsRuntimeConfig,
  EmailRuntimeConfig,
  EncryptionRuntimeConfig,
  GithubOAuthRuntimeConfig,
  GoogleOAuthRuntimeConfig,
  HttpRuntimeConfig,
  MongoRuntimeConfig,
  ObservabilityRuntimeConfig,
  PaymentProvidersRuntimeConfig,
  PersistenceRuntimeConfig,
  PrismaRuntimeConfig,
  PushRuntimeConfig,
  RedisRuntimeConfig,
  SmsRuntimeConfig,
  StorageRuntimeConfig,
  WhatsAppRuntimeConfig,
} from '@workspace/ports/config';

function createConfigSliceProvider<T>(
  provide: symbol,
  selector: (env: ValidatedServerEnv) => T,
): Provider<T> {
  return {
    provide,
    inject: [VALIDATED_ENV_TOKEN],
    useFactory: selector,
  };
}

export const serverConfigProviders: Provider[] = [
  createConfigSliceProvider<AppRuntimeConfig>(APP_RUNTIME_CONFIG_TOKEN, (env) => env.app),
  createConfigSliceProvider<HttpRuntimeConfig>(HTTP_RUNTIME_CONFIG_TOKEN, (env) => env.http),
  createConfigSliceProvider<ContextRuntimeConfig>(
    CONTEXT_RUNTIME_CONFIG_TOKEN,
    (env) => env.context,
  ),
  createConfigSliceProvider<PersistenceRuntimeConfig>(
    PERSISTENCE_RUNTIME_CONFIG_TOKEN,
    (env) => env.persistence,
  ),
  createConfigSliceProvider<MongoRuntimeConfig>(MONGO_RUNTIME_CONFIG_TOKEN, (env) => env.mongo),
  createConfigSliceProvider<PrismaRuntimeConfig>(PRISMA_RUNTIME_CONFIG_TOKEN, (env) => env.prisma),
  createConfigSliceProvider<RedisRuntimeConfig>(REDIS_RUNTIME_CONFIG_TOKEN, (env) => env.redis),
  createConfigSliceProvider<AuthRuntimeConfig>(AUTH_RUNTIME_CONFIG_TOKEN, (env) => env.auth),
  createConfigSliceProvider<GoogleOAuthRuntimeConfig>(
    GOOGLE_OAUTH_RUNTIME_CONFIG_TOKEN,
    (env) => env.oauth.google,
  ),
  createConfigSliceProvider<GithubOAuthRuntimeConfig>(
    GITHUB_OAUTH_RUNTIME_CONFIG_TOKEN,
    (env) => env.oauth.github,
  ),
  createConfigSliceProvider<ObservabilityRuntimeConfig>(
    OBSERVABILITY_RUNTIME_CONFIG_TOKEN,
    (env) => env.observability,
  ),
  createConfigSliceProvider<StorageRuntimeConfig>(
    STORAGE_RUNTIME_CONFIG_TOKEN,
    (env) => env.storage,
  ),
  createConfigSliceProvider<BrandingRuntimeConfig>(
    BRANDING_RUNTIME_CONFIG_TOKEN,
    (env) => env.branding,
  ),
  createConfigSliceProvider<CorsRuntimeConfig>(CORS_RUNTIME_CONFIG_TOKEN, (env) => env.cors),
  createConfigSliceProvider<EmailRuntimeConfig>(EMAIL_RUNTIME_CONFIG_TOKEN, (env) => env.email),
  createConfigSliceProvider<WhatsAppRuntimeConfig>(
    WHATSAPP_RUNTIME_CONFIG_TOKEN,
    (env) => env.whatsApp,
  ),
  createConfigSliceProvider<SmsRuntimeConfig>(SMS_RUNTIME_CONFIG_TOKEN, (env) => env.sms),
  createConfigSliceProvider<PushRuntimeConfig>(PUSH_RUNTIME_CONFIG_TOKEN, (env) => env.push),
  createConfigSliceProvider<PaymentProvidersRuntimeConfig>(
    PAYMENT_PROVIDERS_RUNTIME_CONFIG_TOKEN,
    (env) => env.paymentProviders,
  ),
  createConfigSliceProvider<EncryptionRuntimeConfig>(
    ENCRYPTION_RUNTIME_CONFIG_TOKEN,
    (env) => env.encryption,
  ),
  createConfigSliceProvider<CaptchaRuntimeConfig>(
    CAPTCHA_RUNTIME_CONFIG_TOKEN,
    (env) => env.captcha,
  ),
];

export const serverConfigExports = [
  VALIDATED_ENV_TOKEN,
  APP_RUNTIME_CONFIG_TOKEN,
  HTTP_RUNTIME_CONFIG_TOKEN,
  CONTEXT_RUNTIME_CONFIG_TOKEN,
  PERSISTENCE_RUNTIME_CONFIG_TOKEN,
  MONGO_RUNTIME_CONFIG_TOKEN,
  PRISMA_RUNTIME_CONFIG_TOKEN,
  REDIS_RUNTIME_CONFIG_TOKEN,
  AUTH_RUNTIME_CONFIG_TOKEN,
  GOOGLE_OAUTH_RUNTIME_CONFIG_TOKEN,
  GITHUB_OAUTH_RUNTIME_CONFIG_TOKEN,
  OBSERVABILITY_RUNTIME_CONFIG_TOKEN,
  STORAGE_RUNTIME_CONFIG_TOKEN,
  BRANDING_RUNTIME_CONFIG_TOKEN,
  CORS_RUNTIME_CONFIG_TOKEN,
  EMAIL_RUNTIME_CONFIG_TOKEN,
  WHATSAPP_RUNTIME_CONFIG_TOKEN,
  SMS_RUNTIME_CONFIG_TOKEN,
  PUSH_RUNTIME_CONFIG_TOKEN,
  PAYMENT_PROVIDERS_RUNTIME_CONFIG_TOKEN,
  ENCRYPTION_RUNTIME_CONFIG_TOKEN,
  CAPTCHA_RUNTIME_CONFIG_TOKEN,
] as const;
