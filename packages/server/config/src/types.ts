import type {
  AppRuntimeConfig,
  AuthRuntimeConfig,
  BrandingRuntimeConfig,
  CaptchaRuntimeConfig,
  ContextRuntimeConfig,
  CorsRuntimeConfig,
  EmailRuntimeConfig,
  EncryptionRuntimeConfig,
  HttpRuntimeConfig,
  MongoRuntimeConfig,
  OAuthRuntimeConfig,
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
  storage: StorageRuntimeConfig;
  branding: BrandingRuntimeConfig;
  cors: CorsRuntimeConfig;
  email: EmailRuntimeConfig;
  whatsApp: WhatsAppRuntimeConfig;
  sms: SmsRuntimeConfig;
  push: PushRuntimeConfig;
  paymentProviders: PaymentProvidersRuntimeConfig;
  encryption: EncryptionRuntimeConfig;
  captcha: CaptchaRuntimeConfig;
}
