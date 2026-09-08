import { ServerRuntime, PersistenceRuntimeConfig } from '@workspace/ports/config';
import {
  AppEnvSchema,
  createAppConfig,
  createBrandingConfig,
  createContextConfig,
  createCorsConfig,
  createHttpConfig,
  createObservabilityConfig,
} from './schemas/app.schema';
import {
  AuthenticationEnvSchema,
  createAuthConfig,
  createGithubOAuthConfig,
  createGoogleOAuthConfig,
} from './schemas/auth.schema';
import { CaptchaEnvSchema, createCaptchaConfig } from './schemas/captcha.schema';
import {
  DatabaseEnvSchema,
  createMongoConfig,
  createPrismaConfig,
  createRedisConfig,
} from './schemas/database.schema';
import {
  EmailEnvSchema,
  createEmailConfig,
  createPaymentProvidersConfig,
} from './schemas/email.schema';
import { EncryptionEnvSchema, createEncryptionConfig } from './schemas/encryption.schema';
import { PushEnvSchema, createPushConfig } from './schemas/push.schema';
import { SmsEnvSchema, createSmsConfig } from './schemas/sms.schema';
import { StorageEnvSchema, createStorageConfig } from './schemas/storage.schema';
import { WhatsAppEnvSchema, createWhatsAppConfig } from './schemas/whatsapp.schema';
import { validateSchema, type SchemaValidationResult } from './schemas/validation';
import type { ValidatedServerEnv } from './types';

export { validateSchema, type SchemaValidationResult };

function addValidationError(errors: string[], field: string, message: string): void {
  errors.push(`${field}: ${message}`);
}

const MIN_SECRET_LENGTH = 32;
const ENCRYPTION_KEY_HEX_LENGTH = 64; // 32 bytes for AES-256-GCM

/**
 * Secrets that must be present and strong in production, for BOTH runtimes.
 *
 * These were previously either unchecked or checked only for non-emptiness, so
 * production could boot with them missing and fail later at the point of use —
 * which is exactly what happened with ENCRYPTION_KEY: it defaults to '' with
 * only @IsString(), so `Buffer.from('', 'hex')` is 0 bytes and
 * createCipheriv('aes-256-gcm', ...) throws "Invalid key length" the first time
 * a webhook is ingested. A boot-time failure naming the variable is far cheaper
 * to diagnose than a 500 on the payment path.
 */
function validateProductionEncryptionSecret(
  appSchema: AppEnvSchema,
  encryptionSchema: EncryptionEnvSchema,
  errors: string[],
): void {
  if (appSchema.NODE_ENV !== 'production') return;

  const key = encryptionSchema.ENCRYPTION_KEY?.trim() ?? '';
  if (!key) {
    addValidationError(
      errors,
      'ENCRYPTION_KEY',
      `is required in production (${ENCRYPTION_KEY_HEX_LENGTH} hex characters = 32 bytes for AES-256-GCM)`,
    );
  } else if (!new RegExp(`^[0-9a-fA-F]{${ENCRYPTION_KEY_HEX_LENGTH}}$`).test(key)) {
    addValidationError(
      errors,
      'ENCRYPTION_KEY',
      `must be exactly ${ENCRYPTION_KEY_HEX_LENGTH} hex characters (32 bytes); ` +
        'a shorter or non-hex value yields a weak or invalid AES-256-GCM key',
    );
  }
}

/**
 * Secrets that must be present and strong in production, for the api runtime
 * only. apps/worker never imports the full JWT/Passport AuthCoreModule (it
 * only pulls in AuthCoreInfrastructureModule for HASH_PORT_TOKEN/
 * AUTHENTICATOR_PORT_TOKEN, and ORIGIN_AUTH_SECRET only guards CORS, which the
 * worker doesn't serve — see apps/worker/CLAUDE.md), so requiring these there
 * blocks it from booting for no reason.
 */
function validateProductionAuthSecrets(
  appSchema: AppEnvSchema,
  authSchema: AuthenticationEnvSchema,
  errors: string[],
): void {
  if (appSchema.NODE_ENV !== 'production') return;

  const minLengthSecrets: ReadonlyArray<[string, string | undefined]> = [
    ['JWT_ACCESS_TOKEN_SECRET', authSchema.JWT_ACCESS_TOKEN_SECRET],
    ['JWT_REFRESH_TOKEN_SECRET', authSchema.JWT_REFRESH_TOKEN_SECRET],
    ['JWT_MFA_TOKEN_SECRET', authSchema.JWT_MFA_TOKEN_SECRET],
    ['TOKEN_HASH_SECRET', authSchema.TOKEN_HASH_SECRET],
    ['ORIGIN_AUTH_SECRET', appSchema.ORIGIN_AUTH_SECRET],
  ];

  for (const [name, value] of minLengthSecrets) {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
      addValidationError(errors, name, 'is required in production');
    } else if (trimmed.length < MIN_SECRET_LENGTH) {
      addValidationError(
        errors,
        name,
        `must be at least ${MIN_SECRET_LENGTH} characters in production (got ${trimmed.length})`,
      );
    }
  }
}

function validateApiRuntime(
  appSchema: AppEnvSchema,
  authSchema: AuthenticationEnvSchema,
  errors: string[],
): void {
  if (!authSchema.JWT_ACCESS_TOKEN_SECRET) {
    addValidationError(errors, 'JWT_ACCESS_TOKEN_SECRET', 'is required for the api runtime');
  }

  if (!authSchema.JWT_REFRESH_TOKEN_SECRET) {
    addValidationError(errors, 'JWT_REFRESH_TOKEN_SECRET', 'is required for the api runtime');
  }

  if (appSchema.NODE_ENV === 'production' && appSchema.ALLOWED_ORIGINS.length === 0) {
    addValidationError(
      errors,
      'ALLOWED_ORIGINS',
      'must be a non-empty comma-separated list of allowed origins in production',
    );
  }
}

function validateDatabase(prismaConfig: { databaseUrl: string }, errors: string[]): void {
  if (!prismaConfig.databaseUrl) {
    addValidationError(
      errors,
      'DATABASE_URL',
      'DATABASE_URL is required for canonical PostgreSQL-backed persistence',
    );
  }
}

function validateStorage(
  storageConfig: ReturnType<typeof createStorageConfig>,
  errors: string[],
): void {
  if (storageConfig.provider === 'local') {
    return;
  }

  if (!storageConfig.s3.bucket) {
    addValidationError(
      errors,
      'STORAGE_S3_BUCKET',
      `STORAGE_S3_BUCKET is required when STORAGE_PROVIDER=${storageConfig.provider}`,
    );
  }

  if (
    !storageConfig.s3.endpoint &&
    (storageConfig.provider === 'r2' || storageConfig.provider === 'supabase')
  ) {
    addValidationError(
      errors,
      'STORAGE_S3_ENDPOINT',
      `STORAGE_S3_ENDPOINT is required when STORAGE_PROVIDER=${storageConfig.provider}`,
    );
  }

  if (!storageConfig.s3.accessKeyId) {
    addValidationError(
      errors,
      'STORAGE_S3_ACCESS_KEY_ID',
      `STORAGE_S3_ACCESS_KEY_ID is required when STORAGE_PROVIDER=${storageConfig.provider}`,
    );
  }

  if (!storageConfig.s3.secretAccessKey) {
    addValidationError(
      errors,
      'STORAGE_S3_SECRET_ACCESS_KEY',
      `STORAGE_S3_SECRET_ACCESS_KEY is required when STORAGE_PROVIDER=${storageConfig.provider}`,
    );
  }
}

export function validateServerEnv(
  rawEnv: NodeJS.ProcessEnv,
  runtime: ServerRuntime,
): ValidatedServerEnv {
  const app = validateSchema(AppEnvSchema, rawEnv);
  const database = validateSchema(DatabaseEnvSchema, rawEnv);
  const auth = validateSchema(AuthenticationEnvSchema, rawEnv);
  const storage = validateSchema(StorageEnvSchema, rawEnv);
  const email = validateSchema(EmailEnvSchema, rawEnv);
  const whatsapp = validateSchema(WhatsAppEnvSchema, rawEnv);
  const sms = validateSchema(SmsEnvSchema, rawEnv);
  const push = validateSchema(PushEnvSchema, rawEnv);
  const encryption = validateSchema(EncryptionEnvSchema, rawEnv);
  const captcha = validateSchema(CaptchaEnvSchema, rawEnv);

  const errors = [
    ...app.errors,
    ...database.errors,
    ...auth.errors,
    ...storage.errors,
    ...email.errors,
    ...whatsapp.errors,
    ...sms.errors,
    ...push.errors,
    ...encryption.errors,
    ...captcha.errors,
  ];

  const appConfig = createAppConfig(app.schema, runtime);
  const http = createHttpConfig(app.schema);
  const context = createContextConfig(app.schema);
  const observability = createObservabilityConfig(app.schema, runtime);
  const branding = createBrandingConfig(app.schema);
  const cors = createCorsConfig(app.schema);

  const mongo = createMongoConfig(database.schema);
  const prisma = createPrismaConfig(database.schema);
  const redis = createRedisConfig(database.schema);
  const authConfig = createAuthConfig(auth.schema);
  const oauth = {
    google: createGoogleOAuthConfig(auth.schema),
    github: createGithubOAuthConfig(auth.schema),
  };
  const storageConfig = createStorageConfig(storage.schema);
  const emailConfig = createEmailConfig(email.schema, appConfig.nodeEnv);
  const whatsApp = createWhatsAppConfig(whatsapp.schema);
  const smsConfig = createSmsConfig(sms.schema);
  const pushConfig = createPushConfig(push.schema);
  const paymentProviders = createPaymentProvidersConfig(email.schema, branding);
  const encryptionConfig = createEncryptionConfig(encryption.schema);
  const captchaConfig = createCaptchaConfig(captcha.schema);

  const persistence: PersistenceRuntimeConfig = {
    authRepoDriver: 'prisma',
    transactionDriver: 'prisma',
    eventsStoreDriver: 'prisma',
  };

  if (runtime === 'api') {
    validateApiRuntime(app.schema, auth.schema, errors);
    validateProductionAuthSecrets(app.schema, auth.schema, errors);
  }

  // Both runtimes: apps/worker decrypts stored webhook payloads on the
  // settlement path, so a missing/short ENCRYPTION_KEY breaks it symmetrically.
  validateProductionEncryptionSecret(app.schema, encryption.schema, errors);

  validateDatabase(prisma, errors);
  validateStorage(storageConfig, errors);

  if (errors.length > 0) {
    throw new Error(`Invalid server environment for ${runtime} runtime:\n- ${errors.join('\n- ')}`);
  }

  return {
    app: appConfig,
    http,
    context,
    persistence,
    mongo,
    prisma,
    redis,
    auth: authConfig,
    oauth,
    observability,
    storage: storageConfig,
    branding,
    cors,
    email: emailConfig,
    whatsApp,
    sms: smsConfig,
    push: pushConfig,
    paymentProviders,
    encryption: encryptionConfig,
    captcha: captchaConfig,
  };
}
