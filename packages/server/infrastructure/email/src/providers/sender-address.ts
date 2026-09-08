import type { EmailAddress } from '@workspace/types';
import type { EmailProvider, EmailRuntimeConfig } from '@workspace/ports/config';

interface SenderOverride {
  fromAddress?: string;
  fromName?: string;
}

export interface ResolvedEmailSender {
  email: string;
  name: string;
}

const PROVIDER_SENDER_FIELDS: Record<
  EmailProvider,
  {
    address: keyof EmailRuntimeConfig;
    name: keyof EmailRuntimeConfig;
  }
> = {
  smtp: { address: 'smtpFromAddress', name: 'smtpFromName' },
  resend: { address: 'resendFromAddress', name: 'resendFromName' },
  mailgun: { address: 'mailgunFromAddress', name: 'mailgunFromName' },
  mailtrap: { address: 'mailtrapFromAddress', name: 'mailtrapFromName' },
};

function clean(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function resolveEmailSender(
  emailCfg: EmailRuntimeConfig,
  provider: EmailProvider,
  override: SenderOverride = {},
): ResolvedEmailSender {
  const fields = PROVIDER_SENDER_FIELDS[provider];

  return {
    email:
      clean(override.fromAddress) ??
      clean(emailCfg[fields.address]) ??
      clean(emailCfg.fromAddress) ??
      'noreply@workspace.example',
    name:
      clean(override.fromName) ??
      clean(emailCfg[fields.name]) ??
      clean(emailCfg.fromName) ??
      'workspace',
  };
}

export function formatEmailAddress(address: EmailAddress | string): string {
  if (typeof address === 'string') {
    return address;
  }

  const name = clean(address.name);
  return name ? `"${name}" <${address.email}>` : address.email;
}

export function formatResolvedSender(sender: ResolvedEmailSender): string {
  return formatEmailAddress({ email: sender.email, name: sender.name });
}
