import { describe, expect, it } from '@jest/globals';
import type { EmailRuntimeConfig } from '@workspace/ports/config';
import { formatResolvedSender, resolveEmailSender } from '../src/providers/sender-address';

function baseConfig(overrides: Partial<EmailRuntimeConfig> = {}): EmailRuntimeConfig {
  return {
    provider: 'smtp',
    routingMode: 'single',
    categoryProviderMap: {},
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromName: 'Workspace',
    fromAddress: 'noreply@example.com',
    verifyTransporter: false,
    ...overrides,
  };
}

describe('provider sender addresses', () => {
  it('uses the provider-specific sender before the global sender', () => {
    const cfg = baseConfig({
      resendFromAddress: 'auth@auth.example.com',
      resendFromName: 'Workspace Security',
    });

    expect(resolveEmailSender(cfg, 'resend')).toEqual({
      email: 'auth@auth.example.com',
      name: 'Workspace Security',
    });
  });

  it('falls back to the global sender when a provider sender is not set', () => {
    expect(resolveEmailSender(baseConfig(), 'mailgun')).toEqual({
      email: 'noreply@example.com',
      name: 'Workspace',
    });
  });

  it('does not let whitespace-only provider values shadow the global sender', () => {
    const cfg = baseConfig({
      mailtrapFromAddress: '   ',
      mailtrapFromName: ' ',
    });

    expect(resolveEmailSender(cfg, 'mailtrap')).toEqual({
      email: 'noreply@example.com',
      name: 'Workspace',
    });
  });

  it('formats the resolved default sender for APIs that accept an RFC address string', () => {
    expect(
      formatResolvedSender({
        email: 'auth@auth.example.com',
        name: 'Workspace Security',
      }),
    ).toBe('"Workspace Security" <auth@auth.example.com>');
  });
});
