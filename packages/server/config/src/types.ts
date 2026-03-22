export const LOG_LEVELS = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
] as const;

export const STORE_DRIVERS = ['prisma', 'mongo'] as const;
export const NODE_ENVS = ['development', 'test', 'production'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];
export type StoreDriver = (typeof STORE_DRIVERS)[number];
export type NodeEnv = (typeof NODE_ENVS)[number];
export type ServerRuntime = 'api' | 'workers';

export interface AppRuntimeConfig {
  runtime: ServerRuntime;
  nodeEnv: NodeEnv;
  logLevel: LogLevel;
}

export interface HttpRuntimeConfig {
  port: number;
  jsonBodyLimit: string;
}

export interface ContextRuntimeConfig {
  exposeRawRequest: boolean;
}

export interface PersistenceRuntimeConfig {
  authRepoDriver: StoreDriver;
  transactionDriver: StoreDriver;
  eventsStoreDriver: StoreDriver;
}

export interface MongoRuntimeConfig {
  uri: string;
  dbName?: string;
  maxPoolSize: number;
  minPoolSize: number;
  serverSelectionTimeoutMs: number;
}

export interface PrismaRuntimeConfig {
  databaseUrl: string;
}

export interface RedisRuntimeConfig {
  url?: string;
  host: string;
  port: number;
  password?: string;
  db: number;
  connectionTimeout: number;
  tls: boolean;
}

export interface AuthRuntimeConfig {
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  refresh: {
    rotation: boolean;
  };
}

export interface GoogleOAuthRuntimeConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

export interface GithubOAuthRuntimeConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  authorizeUrl: string;
  tokenUrl: string;
  profileUrl: string;
  emailsUrl: string;
}

export interface ObservabilityRuntimeConfig {
  debugMetrics: boolean;
  enableLoki: boolean;
  localLokiHost: string;
  appName: string;
  env: string;
  appVersion: string;
  instance?: string;
  logLevel: LogLevel;
  lokiUrl?: string;
  lokiUser?: string;
  lokiPassword?: string;
  prometheusUrl?: string;
  prometheusUser?: string;
  prometheusPassword?: string;
  metricsAuth: {
    user?: string;
    pass?: string;
  };
}

export interface OAuthRuntimeConfig {
  google: GoogleOAuthRuntimeConfig;
  github: GithubOAuthRuntimeConfig;
}

export interface ValidatedServerEnv {
  app: AppRuntimeConfig;
  http: HttpRuntimeConfig;
  context: ContextRuntimeConfig;
  persistence: PersistenceRuntimeConfig;
  mongo: MongoRuntimeConfig;
  prisma: PrismaRuntimeConfig;
  redis: RedisRuntimeConfig;
  auth: AuthRuntimeConfig;
  oauth: OAuthRuntimeConfig;
  observability: ObservabilityRuntimeConfig;
}
