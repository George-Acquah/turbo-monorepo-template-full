import { ConfigService, registerAs } from '@nestjs/config';

export interface IAuthConfig {
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  refresh: {
    rotation: boolean;
  };
}

export const AuthConfigKey = 'AUTH_CONFIG';

const authConfigFactory = (config: ConfigService): IAuthConfig => ({
  jwt: {
    accessSecret: config.get<string>('JWT_ACCESS_TOKEN_SECRET', ''),
    accessExpiresIn: config.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
    refreshSecret: config.get<string>('JWT_REFRESH_TOKEN_SECRET', ''),
    refreshExpiresIn: config.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN', '7d'),
  },
  refresh: {
    rotation: config.get<boolean>('JWT_REFRESH_ROTATION', true),
  },
});

export const AuthConfig = registerAs(AuthConfigKey, () => {
  const config = new ConfigService();
  return authConfigFactory(config);
});
