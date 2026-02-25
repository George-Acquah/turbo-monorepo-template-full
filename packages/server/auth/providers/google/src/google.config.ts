import { registerAs } from '@nestjs/config';

const DEFAULT_SCOPES = ['openid', 'email', 'profile'] as const;
export const googleAuthConfigKey = 'googleAuthConfig';

function parseScopes(raw: string | undefined): string[] {
  if (!raw || !raw.trim()) {
    return [...DEFAULT_SCOPES];
  }

  return raw
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export const googleAuthConfig = registerAs(googleAuthConfigKey, () => ({
  clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  scopes: parseScopes(process.env.GOOGLE_SCOPES),
  authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
}));
