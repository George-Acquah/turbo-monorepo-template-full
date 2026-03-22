import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  toBooleanWithDefault,
  toLogLevelWithDefault,
  toNodeEnvWithDefault,
  toNumberWithDefault,
  toOptionalString,
  toStorageProviderWithDefault,
  toStringArrayWithDefault,
  toStringWithDefault,
} from './env.transforms';
import {
  LOG_LEVELS,
  NODE_ENVS,
  type AuthRuntimeConfig,
  type GithubOAuthRuntimeConfig,
  type GoogleOAuthRuntimeConfig,
  type MongoRuntimeConfig,
  type NodeEnv,
  type ObservabilityRuntimeConfig,
  type PersistenceRuntimeConfig,
  type PrismaRuntimeConfig,
  type RedisRuntimeConfig,
  type ServerRuntime,
  STORAGE_PROVIDERS,
  type StorageRuntimeConfig,
  type ValidatedServerEnv,
} from './types';

const DEFAULT_GOOGLE_SCOPES = ['openid', 'email', 'profile'] as const;
const DEFAULT_GITHUB_SCOPES = ['read:user', 'user:email'] as const;

class SharedEnvSchema {
  @Transform(toNodeEnvWithDefault('development'))
  @IsIn(NODE_ENVS)
  NODE_ENV: NodeEnv = 'development';

  @Transform(toLogLevelWithDefault('info'))
  @IsIn(LOG_LEVELS)
  LOG_LEVEL: (typeof LOG_LEVELS)[number] = 'info';

  @Transform(toNumberWithDefault(3000))
  @IsInt()
  @Min(1)
  PORT = 3000;

  @Transform(toStringWithDefault('1mb'))
  @IsString()
  JSON_BODY_LIMIT = '1mb';

  @Transform(toBooleanWithDefault(false))
  @IsBoolean()
  CONTEXT_EXPOSE_RAW_REQUEST = false;

  @Transform(toBooleanWithDefault(false))
  @IsBoolean()
  DEBUG_METRICS = false;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MONGODB_URI?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MONGO_URI?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MONGODB_DB_NAME?: string;

  @Transform(toNumberWithDefault(20))
  @IsInt()
  @Min(1)
  MONGODB_MAX_POOL_SIZE = 20;

  @Transform(toNumberWithDefault(2))
  @IsInt()
  @Min(0)
  MONGODB_MIN_POOL_SIZE = 2;

  @Transform(toNumberWithDefault(10000))
  @IsInt()
  @Min(1)
  MONGODB_SERVER_SELECTION_TIMEOUT_MS = 10000;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @Transform(toStringWithDefault('localhost'))
  @IsString()
  REDIS_HOST = 'localhost';

  @Transform(toNumberWithDefault(6379))
  @IsInt()
  @Min(1)
  REDIS_PORT = 6379;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @Transform(toNumberWithDefault(0))
  @IsInt()
  @Min(0)
  REDIS_DB = 0;

  @Transform(toNumberWithDefault(30000))
  @IsInt()
  @Min(1)
  REDIS_CONNECTION_TIMEOUT = 30000;

  @Transform(toBooleanWithDefault(false))
  @IsBoolean()
  REDIS_TLS = false;

  @Transform(toStringWithDefault(''))
  @IsString()
  JWT_ACCESS_TOKEN_SECRET = '';

  @Transform(toStringWithDefault('15m'))
  @IsString()
  JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';

  @Transform(toStringWithDefault(''))
  @IsString()
  JWT_REFRESH_TOKEN_SECRET = '';

  @Transform(toStringWithDefault('7d'))
  @IsString()
  JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';

  @Transform(toBooleanWithDefault(true))
  @IsBoolean()
  JWT_REFRESH_ROTATION = true;

  @Transform(toStringWithDefault(''))
  @IsString()
  GOOGLE_CLIENT_ID = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  GOOGLE_CLIENT_SECRET = '';

  @Transform(toStringArrayWithDefault(DEFAULT_GOOGLE_SCOPES))
  @IsArray()
  @IsString({ each: true })
  GOOGLE_SCOPES = [...DEFAULT_GOOGLE_SCOPES];

  @Transform(toStringWithDefault(''))
  @IsString()
  GITHUB_CLIENT_ID = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  GITHUB_CLIENT_SECRET = '';

  @Transform(toStringArrayWithDefault(DEFAULT_GITHUB_SCOPES))
  @IsArray()
  @IsString({ each: true })
  GITHUB_SCOPES = [...DEFAULT_GITHUB_SCOPES];

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_CLOUD_LOKI_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_CLOUD_LOKI_USER?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_CLOUD_LOKI_PASSWORD?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_CLOUD_PROMETHEUS_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_CLOUD_PROMETHEUS_USER?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_CLOUD_PROMETHEUS_PASSWORD?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_METRICS_USER?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_METRICS_PASSWORD?: string;

  @Transform(toStringWithDefault('http://172.17.0.1:3100'))
  @IsString()
  LOCAL_LOKI_HOST = 'http://172.17.0.1:3100';

  @Transform(toBooleanWithDefault(false))
  @IsBoolean()
  ENABLE_LOKI = false;

  @Transform(toStringWithDefault('template'))
  @IsString()
  GRAFANA_APP_NAME = 'template';

  @Transform(toStringWithDefault('development'))
  @IsString()
  GRAFANA_ENV = 'development';

  @Transform(toStringWithDefault('0.0.0'))
  @IsString()
  GRAFANA_APP_VERSION = '0.0.0';

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_INSTANCE?: string;

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

  @Transform(toBooleanWithDefault(false))
  @IsBoolean()
  STORAGE_S3_FORCE_PATH_STYLE = false;
}

class ApiEnvSchema extends SharedEnvSchema {}
class WorkersEnvSchema extends SharedEnvSchema {}

function flattenValidationErrors(prefix: string, value: unknown, messages: string[]): void {
  messages.push(`${prefix}: ${String(value)}`);
}

function createMongoConfig(schema: SharedEnvSchema): MongoRuntimeConfig {
  return {
    uri: schema.MONGODB_URI ?? schema.MONGO_URI ?? '',
    dbName: schema.MONGODB_DB_NAME,
    maxPoolSize: schema.MONGODB_MAX_POOL_SIZE,
    minPoolSize: schema.MONGODB_MIN_POOL_SIZE,
    serverSelectionTimeoutMs: schema.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
  };
}

function createPrismaConfig(schema: SharedEnvSchema): PrismaRuntimeConfig {
  return {
    databaseUrl: schema.DATABASE_URL ?? '',
  };
}

function createRedisConfig(schema: SharedEnvSchema): RedisRuntimeConfig {
  return {
    url: schema.REDIS_URL,
    host: schema.REDIS_HOST,
    port: schema.REDIS_PORT,
    password: schema.REDIS_PASSWORD,
    db: schema.REDIS_DB,
    connectionTimeout: schema.REDIS_CONNECTION_TIMEOUT,
    tls: schema.REDIS_TLS,
  };
}

function createAuthConfig(schema: SharedEnvSchema): AuthRuntimeConfig {
  return {
    jwt: {
      accessSecret: schema.JWT_ACCESS_TOKEN_SECRET,
      accessExpiresIn: schema.JWT_ACCESS_TOKEN_EXPIRES_IN,
      refreshSecret: schema.JWT_REFRESH_TOKEN_SECRET,
      refreshExpiresIn: schema.JWT_REFRESH_TOKEN_EXPIRES_IN,
    },
    refresh: {
      rotation: schema.JWT_REFRESH_ROTATION,
    },
  };
}

function createGoogleOAuthConfig(schema: SharedEnvSchema): GoogleOAuthRuntimeConfig {
  return {
    clientId: schema.GOOGLE_CLIENT_ID,
    clientSecret: schema.GOOGLE_CLIENT_SECRET,
    scopes: schema.GOOGLE_SCOPES,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
  };
}

function createGithubOAuthConfig(schema: SharedEnvSchema): GithubOAuthRuntimeConfig {
  return {
    clientId: schema.GITHUB_CLIENT_ID,
    clientSecret: schema.GITHUB_CLIENT_SECRET,
    scopes: schema.GITHUB_SCOPES,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    profileUrl: 'https://api.github.com/user',
    emailsUrl: 'https://api.github.com/user/emails',
  };
}

function createObservabilityConfig(schema: SharedEnvSchema): ObservabilityRuntimeConfig {
  return {
    debugMetrics: schema.DEBUG_METRICS,
    enableLoki: schema.ENABLE_LOKI,
    localLokiHost: schema.LOCAL_LOKI_HOST,
    appName: schema.GRAFANA_APP_NAME,
    env: schema.GRAFANA_ENV,
    appVersion: schema.GRAFANA_APP_VERSION,
    instance: schema.GRAFANA_INSTANCE,
    logLevel: schema.LOG_LEVEL,
    lokiUrl: schema.GRAFANA_CLOUD_LOKI_URL,
    lokiUser: schema.GRAFANA_CLOUD_LOKI_USER,
    lokiPassword: schema.GRAFANA_CLOUD_LOKI_PASSWORD,
    prometheusUrl: schema.GRAFANA_CLOUD_PROMETHEUS_URL,
    prometheusUser: schema.GRAFANA_CLOUD_PROMETHEUS_USER,
    prometheusPassword: schema.GRAFANA_CLOUD_PROMETHEUS_PASSWORD,
    metricsAuth: {
      user: schema.GRAFANA_METRICS_USER,
      pass: schema.GRAFANA_METRICS_PASSWORD,
    },
  };
}

function createStorageConfig(schema: SharedEnvSchema): StorageRuntimeConfig {
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
      forcePathStyle: schema.STORAGE_S3_FORCE_PATH_STYLE,
    },
  };
}

function formatValidationErrors(schema: SharedEnvSchema): string[] {
  return validateSync(schema, {
    skipMissingProperties: false,
    whitelist: false,
    forbidUnknownValues: true,
  }).flatMap((error) =>
    Object.values(error.constraints ?? {}).map((message) => `${error.property}: ${message}`),
  );
}

export function validateServerEnv(
  rawEnv: NodeJS.ProcessEnv,
  runtime: ServerRuntime,
): ValidatedServerEnv {
  const SchemaClass = runtime === 'api' ? ApiEnvSchema : WorkersEnvSchema;
  const schema = plainToInstance(SchemaClass, rawEnv, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  });

  const errors = formatValidationErrors(schema);
  const persistence: PersistenceRuntimeConfig = {
    authRepoDriver: 'prisma',
    transactionDriver: 'prisma',
    eventsStoreDriver: 'prisma',
  };

  const mongo = createMongoConfig(schema);
  const prisma = createPrismaConfig(schema);
  const storage = createStorageConfig(schema);

  if (runtime === 'api') {
    if (!schema.JWT_ACCESS_TOKEN_SECRET) {
      flattenValidationErrors('JWT_ACCESS_TOKEN_SECRET', 'is required for the api runtime', errors);
    }
    if (!schema.JWT_REFRESH_TOKEN_SECRET) {
      flattenValidationErrors('JWT_REFRESH_TOKEN_SECRET', 'is required for the api runtime', errors);
    }
  }

  if (!prisma.databaseUrl) {
    flattenValidationErrors(
      'DATABASE_URL',
      'DATABASE_URL is required for canonical PostgreSQL-backed persistence',
      errors,
    );
  }

  if (storage.provider !== 'local') {
    if (!storage.s3.bucket) {
      flattenValidationErrors(
        'STORAGE_S3_BUCKET',
        `STORAGE_S3_BUCKET is required when STORAGE_PROVIDER=${storage.provider}`,
        errors,
      );
    }
    if (!storage.s3.endpoint && (storage.provider === 'r2' || storage.provider === 'supabase')) {
      flattenValidationErrors(
        'STORAGE_S3_ENDPOINT',
        `STORAGE_S3_ENDPOINT is required when STORAGE_PROVIDER=${storage.provider}`,
        errors,
      );
    }
    if (!storage.s3.accessKeyId) {
      flattenValidationErrors(
        'STORAGE_S3_ACCESS_KEY_ID',
        `STORAGE_S3_ACCESS_KEY_ID is required when STORAGE_PROVIDER=${storage.provider}`,
        errors,
      );
    }
    if (!storage.s3.secretAccessKey) {
      flattenValidationErrors(
        'STORAGE_S3_SECRET_ACCESS_KEY',
        `STORAGE_S3_SECRET_ACCESS_KEY is required when STORAGE_PROVIDER=${storage.provider}`,
        errors,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid server environment for ${runtime} runtime:\n- ${errors.join('\n- ')}`);
  }

  return {
    app: {
      runtime,
      nodeEnv: schema.NODE_ENV,
      logLevel: schema.LOG_LEVEL,
    },
    http: {
      port: schema.PORT,
      jsonBodyLimit: schema.JSON_BODY_LIMIT,
    },
    context: {
      exposeRawRequest: schema.CONTEXT_EXPOSE_RAW_REQUEST,
    },
    persistence,
    mongo,
    prisma,
    redis: createRedisConfig(schema),
    auth: createAuthConfig(schema),
    oauth: {
      google: createGoogleOAuthConfig(schema),
      github: createGithubOAuthConfig(schema),
    },
    observability: createObservabilityConfig(schema),
    storage,
  };
}
