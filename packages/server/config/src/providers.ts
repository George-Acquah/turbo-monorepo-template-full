import type { Provider } from '@nestjs/common';
import type {
  AppRuntimeConfig,
  AuthRuntimeConfig,
  ContextRuntimeConfig,
  GithubOAuthRuntimeConfig,
  GoogleOAuthRuntimeConfig,
  HttpRuntimeConfig,
  MongoRuntimeConfig,
  ObservabilityRuntimeConfig,
  PersistenceRuntimeConfig,
  PrismaRuntimeConfig,
  RedisRuntimeConfig,
  ValidatedServerEnv,
} from './types';

export const VALIDATED_ENV_TOKEN = Symbol('VALIDATED_ENV_TOKEN');
export const APP_RUNTIME_CONFIG_TOKEN = Symbol('APP_RUNTIME_CONFIG_TOKEN');
export const HTTP_RUNTIME_CONFIG_TOKEN = Symbol('HTTP_RUNTIME_CONFIG_TOKEN');
export const CONTEXT_RUNTIME_CONFIG_TOKEN = Symbol('CONTEXT_RUNTIME_CONFIG_TOKEN');
export const PERSISTENCE_RUNTIME_CONFIG_TOKEN = Symbol('PERSISTENCE_RUNTIME_CONFIG_TOKEN');
export const MONGO_RUNTIME_CONFIG_TOKEN = Symbol('MONGO_RUNTIME_CONFIG_TOKEN');
export const PRISMA_RUNTIME_CONFIG_TOKEN = Symbol('PRISMA_RUNTIME_CONFIG_TOKEN');
export const REDIS_RUNTIME_CONFIG_TOKEN = Symbol('REDIS_RUNTIME_CONFIG_TOKEN');
export const AUTH_RUNTIME_CONFIG_TOKEN = Symbol('AUTH_RUNTIME_CONFIG_TOKEN');
export const GOOGLE_OAUTH_RUNTIME_CONFIG_TOKEN = Symbol('GOOGLE_OAUTH_RUNTIME_CONFIG_TOKEN');
export const GITHUB_OAUTH_RUNTIME_CONFIG_TOKEN = Symbol('GITHUB_OAUTH_RUNTIME_CONFIG_TOKEN');
export const OBSERVABILITY_RUNTIME_CONFIG_TOKEN = Symbol('OBSERVABILITY_RUNTIME_CONFIG_TOKEN');

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
] as const;
