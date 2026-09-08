import type { EmailCategory } from '@workspace/constants';

export const LOG_LEVELS = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] as const;

export const STORE_DRIVERS = ['prisma'] as const;
export const NODE_ENVS = ['development', 'test', 'production'] as const;
export const STORAGE_PROVIDERS = ['local', 's3', 'r2', 'supabase'] as const;
export const EMAIL_PROVIDERS = ['smtp', 'resend', 'mailgun', 'mailtrap'] as const;
export const PAYMENT_PROVIDERS_LIST = ['hubtel', 'paystack', 'flutterwave'] as const;
export const WHATSAPP_PROVIDERS = ['twilio', 'meta'] as const;

export type WhatsAppProvider = (typeof WHATSAPP_PROVIDERS)[number];

export type LogLevel = (typeof LOG_LEVELS)[number];
export type StoreDriver = (typeof STORE_DRIVERS)[number];
export type NodeEnv = (typeof NODE_ENVS)[number];
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];
export type PaymentProviderName = (typeof PAYMENT_PROVIDERS_LIST)[number];
export type ServerRuntime = 'api' | 'workers';

export interface AppRuntimeConfig {
  runtime: ServerRuntime;
  nodeEnv: NodeEnv;
  logLevel: LogLevel;
  baseUrl: string;
  /** Defaults to `nodeEnv !== 'production'`; ENABLE_SWAGGER overrides explicitly. */
  enableSwagger: boolean;
}

export interface HttpRuntimeConfig {
  port: number;
  jsonBodyLimit: string;
}

export interface ContextRuntimeConfig {
  exposeRawRequest: boolean;
  allowLegacyTenantHeader: boolean;
}

export interface PersistenceRuntimeConfig {
  authRepoDriver: StoreDriver;
  transactionDriver: StoreDriver;
  eventsStoreDriver: StoreDriver;
}

export interface StorageRuntimeConfig {
  provider: StorageProvider;
  defaultBucket: string;
  publicBaseUrl?: string;
  local: {
    rootPath: string;
  };
  s3: {
    endpoint?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    /** Public-read bucket (avatars, logos, thumbnails). When unset, callers
     * fall back to `bucket`/`defaultBucket` and no object is ever treated as
     * publicly reachable — see `S3StorageAdapter.getPublicUrl`. */
    publicBucket?: string;
    forcePathStyle: boolean;
  };
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
  /**
   * Maximum Postgres connections held by this process's pool.
   *
   * Must be set here rather than as `?connection_limit=` on the URL: that is a
   * Prisma query-engine parameter, and this stack uses the @prisma/adapter-pg
   * driver adapter, which ignores it and applies node-postgres' own default
   * instead. Every replica of every service opens up to this many, so the sum
   * across services and replicas has to stay under the database's own limit.
   */
  poolMax: number;
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
    mfaSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string[];
  };
  secrets: {
    tokenHashSecret: string;
  };
  refresh: {
    rotation: boolean;
  };
  // resolver: admin header-based resolver removed. Admin detection should be
  // implemented via middleware or edge policies (e.g., Cloudflare).
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

export interface BrandingRuntimeConfig {
  apiUrl: string;
  landingUrl: string;
  portalUrl: string;
  landingName: string;
  supportEmail: string;
}

export interface CorsRuntimeConfig {
  allowedOrigins: string[];
  allowedHeaders: string[];
  originAuthSecret: string;
}

export interface EmailRuntimeConfig {
  provider: EmailProvider;
  /** 'single' (default) always uses `provider`; 'category' consults `categoryProviderMap` first. */
  routingMode: 'single' | 'category';
  /** Per-category provider overrides, only consulted when `routingMode === 'category'`. */
  categoryProviderMap: Partial<Record<EmailCategory, EmailProvider>>;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
  resendFromAddress?: string;
  resendFromName?: string;
  mailgunFromAddress?: string;
  mailgunFromName?: string;
  mailtrapFromAddress?: string;
  mailtrapFromName?: string;
  smtpFromAddress?: string;
  smtpFromName?: string;
  resendApiKey?: string;
  mailgunApiKey?: string;
  mailgunDomain?: string;
  /** Mailgun's API base region. Defaults to 'us'. */
  mailgunRegion?: 'us' | 'eu';
  /** Mailtrap Sending API token — distinct from the Testing/sandbox product's SMTP credentials. */
  mailtrapApiToken?: string;
  /** When set, ALL outgoing emails are redirected to this address (dev/test only). */
  overrideTo?: string;
  /** Verify the SMTP transporter can connect before sending. Defaults to true in production. */
  verifyTransporter: boolean;
}

export interface WhatsAppRuntimeConfig {
  provider: WhatsAppProvider;
  // Twilio
  twilioAccountSid: string;
  twilioAuthToken: string;
  /** E.164 phone number provisioned for WhatsApp, e.g. +14155238886 */
  twilioWhatsAppFrom: string;
  /** Optional Twilio Messaging Service SID for template messages */
  messagingServiceSid?: string;
  // Meta Cloud API
  /** Meta WhatsApp Business phone number ID */
  metaPhoneNumberId: string;
  /** Long-lived / system user access token for the Graph API */
  metaAccessToken: string;
  /** Graph API version, e.g. 'v21.0' */
  metaApiVersion: string;
}

export interface SmsRuntimeConfig {
  // Twilio (reuses the same account credentials as WhatsAppRuntimeConfig)
  twilioAccountSid: string;
  twilioAuthToken: string;
  /** E.164 phone number provisioned for SMS, e.g. +14155238886 */
  twilioSmsFrom: string;
}

export interface PushRuntimeConfig {
  // Firebase Cloud Messaging service-account credentials — covers
  // iOS/Android/Web through one API (an APNs key configured inside the
  // Firebase project bridges iOS).
  fcmProjectId: string;
  fcmClientEmail: string;
  fcmPrivateKey: string;
}

export interface EncryptionRuntimeConfig {
  /** 32-byte AES-256-GCM key, hex-encoded (64 hex chars). */
  key: string;
}

export interface CaptchaRuntimeConfig {
  turnstileSecretKey: string;
}

export interface PaymentProvidersRuntimeConfig {
  defaultProvider: PaymentProviderName;
  appUrl: string;
  frontendUrl?: string;
  /**
   * Refund request window, in days, measured from `Payment.capturedAt`.
   * Requesting past this window requires the `refund:approve` permission as
   * an override (doc 07 §7). Default value is a placeholder pending business
   * sign-off, same status as the seeded price-plan amounts (doc 13).
   */
  refundWindowDays: number;
  /**
   * Subscription renewal grace period, in days, after `currentPeriodEnd` if
   * a renewal charge fails (doc 07 §7: "graceUntil = end+3d"). Default value
   * is a placeholder pending business sign-off, same status as
   * `refundWindowDays`.
   */
  subscriptionGraceDays: number;
  /** Pre-renewal notice window, in days before `currentPeriodEnd`. */
  subscriptionPreRenewalNoticeDays: number;
  hubtel: {
    apiId: string;
    apiKey: string;
    merchantAccountNumber: string;
    webhookUrl?: string;
    callbackUrl?: string;
    returnUrl?: string;
    cancelUrl?: string;
    refundCallbackUrl?: string;
  };
  paystack: {
    secretKey: string;
    callbackUrl?: string;
    returnUrl?: string;
    cancelUrl?: string;
  };
  flutterwave: {
    secretKey: string;
    callbackUrl?: string;
    returnUrl?: string;
    cancelUrl?: string;
  };
}
