import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';
import {
  toBooleanWithDefault,
  toStringArrayWithDefault,
  toStringWithDefault,
} from '@/env.transforms';
import {
  type AuthRuntimeConfig,
  type GithubOAuthRuntimeConfig,
  type GoogleOAuthRuntimeConfig,
} from '@workspace/ports/config';

const DEFAULT_GOOGLE_SCOPES = ['openid', 'email', 'profile'] as const;
const DEFAULT_GITHUB_SCOPES = ['read:user', 'user:email'] as const;
// Deprecated: admin header resolver removed — admin detection must be implemented
// via a dedicated middleware or at the edge (Cloudflare). Previously default
// values for AUTH_ADMIN_* lived here; they have been removed.
const DEFAULT_JWT_AUDIENCE = ['workspace'] as const;

class AuthenticationEnvSchema {
  @Transform(toStringWithDefault(''))
  @IsString()
  JWT_ACCESS_TOKEN_SECRET = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  JWT_MFA_TOKEN_SECRET = '';

  @Transform(toStringWithDefault('15m'))
  @IsString()
  JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';

  @Transform(toStringWithDefault(''))
  @IsString()
  JWT_REFRESH_TOKEN_SECRET = '';

  @Transform(toStringWithDefault('7d'))
  @IsString()
  JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';

  @Transform(toBooleanWithDefault(true))
  @IsBoolean()
  JWT_REFRESH_ROTATION = true;

  @Transform(toStringWithDefault(''))
  @IsString()
  TOKEN_HASH_SECRET = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  JWT_ISSUER = '';

  @Transform(toStringArrayWithDefault(DEFAULT_JWT_AUDIENCE))
  @IsArray()
  @IsString({ each: true })
  JWT_AUDIENCE = [...DEFAULT_JWT_AUDIENCE];

  @Transform(toStringWithDefault(''))
  @IsString()
  GOOGLE_CLIENT_ID = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  GOOGLE_CLIENT_SECRET = '';

  @Transform(toStringArrayWithDefault(DEFAULT_GOOGLE_SCOPES))
  @IsArray()
  @IsString({ each: true })
  GOOGLE_SCOPES = [...DEFAULT_GOOGLE_SCOPES];

  @Transform(toStringWithDefault(''))
  @IsString()
  GITHUB_CLIENT_ID = '';

  @Transform(toStringWithDefault(''))
  @IsString()
  GITHUB_CLIENT_SECRET = '';

  @Transform(toStringArrayWithDefault(DEFAULT_GITHUB_SCOPES))
  @IsArray()
  @IsString({ each: true })
  GITHUB_SCOPES = [...DEFAULT_GITHUB_SCOPES];
}

function createAuthConfig(schema: AuthenticationEnvSchema): AuthRuntimeConfig {
  return {
    jwt: {
      accessSecret: schema.JWT_ACCESS_TOKEN_SECRET,
      mfaSecret: schema.JWT_MFA_TOKEN_SECRET,
      accessExpiresIn: schema.JWT_ACCESS_TOKEN_EXPIRES_IN,
      refreshSecret: schema.JWT_REFRESH_TOKEN_SECRET,
      refreshExpiresIn: schema.JWT_REFRESH_TOKEN_EXPIRES_IN,
      issuer: schema.JWT_ISSUER,
      audience: schema.JWT_AUDIENCE,
    },
    secrets: {
      tokenHashSecret: schema.TOKEN_HASH_SECRET, // Using access token secret for hashing as an example
    },
    refresh: {
      rotation: schema.JWT_REFRESH_ROTATION,
    },
    // resolver: removed — admin header-based resolver deprecated/removed
  };
}

function createGoogleOAuthConfig(schema: AuthenticationEnvSchema): GoogleOAuthRuntimeConfig {
  return {
    clientId: schema.GOOGLE_CLIENT_ID,
    clientSecret: schema.GOOGLE_CLIENT_SECRET,
    scopes: schema.GOOGLE_SCOPES,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
  };
}

function createGithubOAuthConfig(schema: AuthenticationEnvSchema): GithubOAuthRuntimeConfig {
  return {
    clientId: schema.GITHUB_CLIENT_ID,
    clientSecret: schema.GITHUB_CLIENT_SECRET,
    scopes: schema.GITHUB_SCOPES,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    profileUrl: 'https://api.github.com/user',
    emailsUrl: 'https://api.github.com/user/emails',
  };
}

export {
  AuthenticationEnvSchema,
  createAuthConfig,
  createGoogleOAuthConfig,
  createGithubOAuthConfig,
};
