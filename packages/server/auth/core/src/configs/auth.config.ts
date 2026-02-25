import { registerAs } from '@nestjs/config';

export const AuthConfigKey = 'AUTH_CONFIG';

export const AuthConfig = registerAs(AuthConfigKey, () => ({
  jwt: {
    accessSecret: process.env.JWT_ACCESS_TOKEN_SECRET ?? '',
    accessExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_TOKEN_SECRET ?? '',
    refreshExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? '7d',
  },
  refresh: {
    rotation: (process.env.JWT_REFRESH_ROTATION ?? 'true') === 'true',
  },
}));
