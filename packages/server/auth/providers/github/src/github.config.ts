import { registerAs } from '@nestjs/config';

const DEFAULT_SCOPES = ['read:user', 'user:email'] as const;
export const githubAuthConfigKey = 'githubAuthConfig';

function parseScopes(raw: string | undefined): string[] {
  if (!raw || !raw.trim()) {
    return [...DEFAULT_SCOPES];
  }

  return raw
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export const githubAuthConfig = registerAs(githubAuthConfigKey, () => ({
  clientId: process.env.GITHUB_CLIENT_ID ?? '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
  scopes: parseScopes(process.env.GITHUB_SCOPES),
  authorizeUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  profileUrl: 'https://api.github.com/user',
  emailsUrl: 'https://api.github.com/user/emails',
}));
