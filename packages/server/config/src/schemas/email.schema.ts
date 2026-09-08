import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import {
  toBooleanWithDefault,
  toNumberWithDefault,
  toOptionalBoolean,
  toOptionalString,
  toStringWithDefault,
} from '@/env.transforms';
import {
  EMAIL_PROVIDERS,
  PAYMENT_PROVIDERS_LIST,
  type EmailProvider,
  type EmailRuntimeConfig,
  type NodeEnv,
  type PaymentProviderName,
  type PaymentProvidersRuntimeConfig,
} from '@workspace/ports/config';
import { EmailCategory } from '@workspace/constants';

export class EmailEnvSchema {
  @Transform(toStringWithDefault('smtp'))
  @IsIn(EMAIL_PROVIDERS)
  EMAIL_PROVIDER: EmailProvider = 'smtp';

  // 'single' (default) always uses EMAIL_PROVIDER; 'category' routes per
  // message via the EMAIL_*_PROVIDER overrides below, falling back to
  // EMAIL_PROVIDER for any category left unset. Opt-in only — omitting all
  // of these vars is byte-identical to today's single-provider behavior.
  @Transform(toStringWithDefault('single'))
  @IsIn(['single', 'category'])
  EMAIL_ROUTING_MODE: 'single' | 'category' = 'single';

  @Transform(toOptionalString)
  @IsOptional()
  @IsIn(EMAIL_PROVIDERS)
  EMAIL_SECURITY_PROVIDER?: EmailProvider;

  @Transform(toOptionalString)
  @IsOptional()
  @IsIn(EMAIL_PROVIDERS)
  EMAIL_PAYMENTS_PROVIDER?: EmailProvider;

  @Transform(toOptionalString)
  @IsOptional()
  @IsIn(EMAIL_PROVIDERS)
  EMAIL_EVENTS_PROVIDER?: EmailProvider;

  @Transform(toOptionalString)
  @IsOptional()
  @IsIn(EMAIL_PROVIDERS)
  EMAIL_MARKETING_PROVIDER?: EmailProvider;

  @Transform(toStringWithDefault('smtp.gmail.com'))
  @IsString()
  EMAIL_HOST = 'smtp.gmail.com';

  @Transform(toNumberWithDefault(587))
  @IsInt()
  @Min(1)
  EMAIL_PORT = 587;

  @Transform(toBooleanWithDefault(false))
  @IsBoolean()
  EMAIL_SECURE = false;

  @Transform(toStringWithDefault(''))
  @IsString()
  EMAIL_USER = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  EMAIL_PASSWORD = '';

  @Transform(toStringWithDefault('workspace'))
  @IsString()
  EMAIL_FROM_NAME = 'workspace';

  @Transform(toStringWithDefault('noreply@workspace.example'))
  @IsString()
  EMAIL_FROM_ADDRESS = 'noreply@workspace.example';

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  RESEND_FROM_ADDRESS?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  RESEND_FROM_NAME?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MAILGUN_FROM_ADDRESS?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MAILGUN_FROM_NAME?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MAILTRAP_FROM_ADDRESS?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MAILTRAP_FROM_NAME?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  SMTP_FROM_ADDRESS?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  SMTP_FROM_NAME?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MAILGUN_API_KEY?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MAILGUN_DOMAIN?: string;

  @Transform(toStringWithDefault('us'))
  @IsIn(['us', 'eu'])
  MAILGUN_REGION: 'us' | 'eu' = 'us';

  // Mailtrap's transactional Sending API token — distinct from the Testing/
  // sandbox product's SMTP credentials (which flow through EMAIL_HOST/
  // EMAIL_USER/EMAIL_PASSWORD via EMAIL_PROVIDER=smtp instead).
  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  MAILTRAP_API_TOKEN?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  EMAIL_OVERRIDE_TO?: string;

  // No hardcoded default here — the effective default (true in production,
  // false otherwise) is resolved in createEmailConfig(), which needs
  // AppEnvSchema's nodeEnv to compute it.
  @Transform(toOptionalBoolean)
  @IsOptional()
  @IsBoolean()
  VERIFY_EMAIL_TRANSPORTER?: boolean;

  @Transform(toStringWithDefault('paystack'))
  @IsIn(PAYMENT_PROVIDERS_LIST)
  PAYMENT_PROVIDER: PaymentProviderName = 'paystack';

  // Placeholder default pending business sign-off (doc 13) — same status as
  // the seeded price-plan amounts.
  @Transform(toNumberWithDefault(14))
  @IsInt()
  @Min(0)
  REFUND_WINDOW_DAYS = 14;

  @Transform(toNumberWithDefault(3))
  @IsInt()
  @Min(0)
  SUBSCRIPTION_GRACE_DAYS = 3;

  @Transform(toNumberWithDefault(3))
  @IsInt()
  @Min(0)
  SUBSCRIPTION_PRE_RENEWAL_NOTICE_DAYS = 3;

  @Transform(toStringWithDefault(''))
  @IsString()
  HUBTEL_API_ID = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  HUBTEL_API_KEY = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  HUBTEL_MERCHANT_ACCOUNT_NUMBER = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  HUBTEL_POS_SALES_ID = '';

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  HUBTEL_WEBHOOK_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  HUBTEL_CALLBACK_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  HUBTEL_RETURN_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  HUBTEL_CANCEL_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  HUBTEL_REFUND_CALLBACK_URL?: string;

  @Transform(toStringWithDefault(''))
  @IsString()
  PAYSTACK_SECRET_KEY = '';

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  PAYSTACK_CALLBACK_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  PAYSTACK_RETURN_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  PAYSTACK_CANCEL_URL?: string;

  @Transform(toStringWithDefault(''))
  @IsString()
  FLW_SECRET_KEY = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  FLUTTERWAVE_SECRET_KEY = '';

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  FLUTTERWAVE_CALLBACK_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  FLUTTERWAVE_RETURN_URL?: string;

  @Transform(toOptionalString)
  @IsOptional()
  @IsString()
  FLUTTERWAVE_CANCEL_URL?: string;
}

function normalizeUrlOrUndef(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return undefined;
  }
}

function computePaymentCallbackUrl(
  explicit: string | undefined,
  browserBase: string,
  provider: string,
): string | undefined {
  return (
    normalizeUrlOrUndef(explicit) ??
    (browserBase ? normalizeUrlOrUndef(`${browserBase}/payments/callback/${provider}`) : undefined)
  );
}

export function createEmailConfig(schema: EmailEnvSchema, nodeEnv: NodeEnv): EmailRuntimeConfig {
  return {
    provider: schema.EMAIL_PROVIDER,
    routingMode: schema.EMAIL_ROUTING_MODE,
    categoryProviderMap: {
      [EmailCategory.SECURITY]: schema.EMAIL_SECURITY_PROVIDER,
      [EmailCategory.PAYMENTS]: schema.EMAIL_PAYMENTS_PROVIDER,
      [EmailCategory.EVENTS]: schema.EMAIL_EVENTS_PROVIDER,
      [EmailCategory.MARKETING]: schema.EMAIL_MARKETING_PROVIDER,
    },
    host: schema.EMAIL_HOST,
    port: schema.EMAIL_PORT,
    secure: schema.EMAIL_SECURE,
    user: schema.EMAIL_USER,
    password: schema.EMAIL_PASSWORD,
    fromName: schema.EMAIL_FROM_NAME,
    fromAddress: schema.EMAIL_FROM_ADDRESS,
    resendFromAddress: schema.RESEND_FROM_ADDRESS,
    resendFromName: schema.RESEND_FROM_NAME,
    mailgunFromAddress: schema.MAILGUN_FROM_ADDRESS,
    mailgunFromName: schema.MAILGUN_FROM_NAME,
    mailtrapFromAddress: schema.MAILTRAP_FROM_ADDRESS,
    mailtrapFromName: schema.MAILTRAP_FROM_NAME,
    smtpFromAddress: schema.SMTP_FROM_ADDRESS,
    smtpFromName: schema.SMTP_FROM_NAME,
    resendApiKey: schema.RESEND_API_KEY,
    mailgunApiKey: schema.MAILGUN_API_KEY,
    mailgunDomain: schema.MAILGUN_DOMAIN,
    mailgunRegion: schema.MAILGUN_REGION,
    mailtrapApiToken: schema.MAILTRAP_API_TOKEN,
    overrideTo: schema.EMAIL_OVERRIDE_TO,
    verifyTransporter: schema.VERIFY_EMAIL_TRANSPORTER ?? nodeEnv === 'production',
  };
}

export function createPaymentProvidersConfig(
  schema: EmailEnvSchema,
  branding: {
    apiUrl: string;
    landingUrl?: string;
    portalUrl: string;
    landingName: string;
    supportEmail: string;
  },
): PaymentProvidersRuntimeConfig {
  const appUrl = branding.apiUrl.trim().replace(/\/+$/, '');
  const frontendUrl = branding.landingUrl || branding.portalUrl || undefined;

  return {
    defaultProvider: schema.PAYMENT_PROVIDER,
    appUrl,
    frontendUrl,
    refundWindowDays: schema.REFUND_WINDOW_DAYS,
    subscriptionGraceDays: schema.SUBSCRIPTION_GRACE_DAYS,
    subscriptionPreRenewalNoticeDays: schema.SUBSCRIPTION_PRE_RENEWAL_NOTICE_DAYS,
    hubtel: {
      apiId: schema.HUBTEL_API_ID,
      apiKey: schema.HUBTEL_API_KEY,
      merchantAccountNumber: schema.HUBTEL_MERCHANT_ACCOUNT_NUMBER || schema.HUBTEL_POS_SALES_ID,
      webhookUrl:
        normalizeUrlOrUndef(schema.HUBTEL_WEBHOOK_URL) ??
        (appUrl ? normalizeUrlOrUndef(`${appUrl}/api/v1/payments/webhooks/hubtel`) : undefined),
      callbackUrl: computePaymentCallbackUrl(
        schema.HUBTEL_CALLBACK_URL,
        frontendUrl ?? '',
        'hubtel',
      ),
      returnUrl: normalizeUrlOrUndef(schema.HUBTEL_RETURN_URL),
      cancelUrl: normalizeUrlOrUndef(schema.HUBTEL_CANCEL_URL),
      refundCallbackUrl: normalizeUrlOrUndef(schema.HUBTEL_REFUND_CALLBACK_URL),
    },
    paystack: {
      secretKey: schema.PAYSTACK_SECRET_KEY,
      callbackUrl: computePaymentCallbackUrl(
        schema.PAYSTACK_CALLBACK_URL,
        frontendUrl ?? '',
        'paystack',
      ),
      returnUrl: normalizeUrlOrUndef(schema.PAYSTACK_RETURN_URL),
      cancelUrl: normalizeUrlOrUndef(schema.PAYSTACK_CANCEL_URL),
    },
    flutterwave: {
      secretKey: schema.FLW_SECRET_KEY || schema.FLUTTERWAVE_SECRET_KEY,
      callbackUrl: computePaymentCallbackUrl(
        schema.FLUTTERWAVE_CALLBACK_URL,
        frontendUrl ?? '',
        'flutterwave',
      ),
      returnUrl: normalizeUrlOrUndef(schema.FLUTTERWAVE_RETURN_URL),
      cancelUrl: normalizeUrlOrUndef(schema.FLUTTERWAVE_CANCEL_URL),
    },
  };
}
