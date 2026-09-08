import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import {
  toBooleanWithDefault,
  toNumberWithDefault,
  toOptionalString,
  toStringWithDefault,
} from '@/env.transforms';
import {
  type MongoRuntimeConfig,
  type PrismaRuntimeConfig,
  type RedisRuntimeConfig,
} from '@workspace/ports/config';
class DatabaseEnvSchema {
  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  /**
   * Postgres pool ceiling for this process. Defaults to node-postgres' own
   * default (10) so behaviour is unchanged unless set. Lower it on the worker,
   * which runs many queues but little concurrent query work, before scaling
   * replicas — every replica opens its own pool.
   */
  @Transform(toNumberWithDefault(10))
  @IsInt()
  @Min(1)
  DATABASE_POOL_MAX = 10;

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
}

function createMongoConfig(schema: DatabaseEnvSchema): MongoRuntimeConfig {
  return {
    uri: schema.MONGODB_URI ?? schema.MONGO_URI ?? '',
    dbName: schema.MONGODB_DB_NAME,
    maxPoolSize: schema.MONGODB_MAX_POOL_SIZE,
    minPoolSize: schema.MONGODB_MIN_POOL_SIZE,
    serverSelectionTimeoutMs: schema.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
  };
}

function createPrismaConfig(schema: DatabaseEnvSchema): PrismaRuntimeConfig {
  return {
    databaseUrl: schema.DATABASE_URL ?? '',
    poolMax: schema.DATABASE_POOL_MAX,
  };
}

function createRedisConfig(schema: DatabaseEnvSchema): RedisRuntimeConfig {
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

export { createMongoConfig, createPrismaConfig, createRedisConfig, DatabaseEnvSchema };
