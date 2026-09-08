import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { HttpHeaders } from '@workspace/constants';
import {
  toBooleanWithDefault,
  toLogLevelWithDefault,
  toNodeEnvWithDefault,
  toNumberWithDefault,
  toOptionalBoolean,
  toOptionalString,
  toStringArrayWithDefault,
  toStringWithDefault,
} from '@/env.transforms';
import {
  LOG_LEVELS,
  NODE_ENVS,
  type AppRuntimeConfig,
  type BrandingRuntimeConfig,
  type ContextRuntimeConfig,
  type CorsRuntimeConfig,
  type HttpRuntimeConfig,
  type LogLevel,
  type NodeEnv,
  type ObservabilityRuntimeConfig,
  type ServerRuntime,
} from '@workspace/ports/config';

export class AppEnvSchema {
  @Transform(toNodeEnvWithDefault('development'))
  @IsIn(NODE_ENVS)
  NODE_ENV: NodeEnv = 'development';

  @Transform(toLogLevelWithDefault('info'))
  @IsIn(LOG_LEVELS)
  LOG_LEVEL: LogLevel = 'info';

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
  CONTEXT_ALLOW_LEGACY_TENANT_HEADER = false;

  @Transform(toBooleanWithDefault(false))
  @IsBoolean()
  DEBUG_METRICS = false;

  // Tri-state (unset = derive from NODE_ENV, see createAppConfig) rather than a
  // hardcoded default here — lets an operator explicitly opt in on a
  // production-mode deployment (e.g. temporary debugging) without flipping
  // NODE_ENV itself, which also changes OriginAuthMiddleware's dev bypass and
  // ContextMiddleware's security headers.
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  ENABLE_SWAGGER?: boolean;

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

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  GRAFANA_APP_NAME?: string;

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

  @Transform(toStringArrayWithDefault([]))
  @IsArray()
  @IsString({ each: true })
  ALLOWED_ORIGINS: string[] = [];

  @Transform(
    toStringArrayWithDefault([
      HttpHeaders.CONTENT_TYPE,
      HttpHeaders.AUTHORIZATION,
      HttpHeaders.REQUESTED_WITH,
      HttpHeaders.ORIGIN_AUTH,
    ]),
  )
  @IsArray()
  @IsString({ each: true })
  ALLOWED_HEADERS: string[] = [
    HttpHeaders.CONTENT_TYPE,
    HttpHeaders.AUTHORIZATION,
    HttpHeaders.REQUESTED_WITH,
    HttpHeaders.ORIGIN_AUTH,
  ];

  @Transform(toStringWithDefault(''))
  @IsOptional()
  @IsString()
  ORIGIN_AUTH_SECRET = '';

  @Transform(toStringWithDefault('http://localhost:3000'))
  @IsString()
  API_URL = 'http://localhost:3000';

  @Transform(toStringWithDefault(''))
  @IsString()
  LANDING_URL = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  PORTAL_URL = '';

  @Transform(toStringWithDefault('workspace'))
  @IsString()
  LANDING_NAME = 'workspace';

  @Transform(toStringWithDefault('support@example.com'))
  @IsString()
  SUPPORT_EMAIL = 'support@example.com';
}

export function createAppConfig(schema: AppEnvSchema, runtime: ServerRuntime): AppRuntimeConfig {
  return {
    runtime,
    nodeEnv: schema.NODE_ENV,
    logLevel: schema.LOG_LEVEL,
    baseUrl: schema.API_URL,
    enableSwagger: schema.ENABLE_SWAGGER ?? schema.NODE_ENV !== 'production',
  };
}

export function createHttpConfig(schema: AppEnvSchema): HttpRuntimeConfig {
  return {
    port: schema.PORT,
    jsonBodyLimit: schema.JSON_BODY_LIMIT,
  };
}

export function createContextConfig(schema: AppEnvSchema): ContextRuntimeConfig {
  return {
    exposeRawRequest: schema.CONTEXT_EXPOSE_RAW_REQUEST,
    allowLegacyTenantHeader: schema.CONTEXT_ALLOW_LEGACY_TENANT_HEADER,
  };
}

export function createObservabilityConfig(
  schema: AppEnvSchema,
  runtime: ServerRuntime,
): ObservabilityRuntimeConfig {
  return {
    debugMetrics: schema.DEBUG_METRICS,
    enableLoki: schema.ENABLE_LOKI,
    localLokiHost: schema.LOCAL_LOKI_HOST,
    appName: schema.GRAFANA_APP_NAME?.trim() || `workspace-${runtime === 'workers' ? 'worker' : 'api'}`,
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

export function createCorsConfig(schema: AppEnvSchema): CorsRuntimeConfig {
  return {
    allowedOrigins: schema.ALLOWED_ORIGINS,
    allowedHeaders: schema.ALLOWED_HEADERS,
    originAuthSecret: schema.ORIGIN_AUTH_SECRET,
  };
}

export function createBrandingConfig(schema: AppEnvSchema): BrandingRuntimeConfig {
  return {
    apiUrl: schema.API_URL,
    landingUrl: schema.LANDING_URL,
    portalUrl: schema.PORTAL_URL || 'http://localhost:3002',
    landingName: schema.LANDING_NAME,
    supportEmail: schema.SUPPORT_EMAIL,
  };
}
