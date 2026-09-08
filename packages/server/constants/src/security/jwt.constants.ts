export const JwtAlgorithms = {
  HS256: 'HS256',
  RS256: 'RS256',
  ES256: 'ES256',
} as const;

export type JwtAlgorithm = (typeof JwtAlgorithms)[keyof typeof JwtAlgorithms];

export const DefaultTokenTTL = {
  ACCESS_TOKEN: 900, // 15 minutes (in seconds)
  REFRESH_TOKEN: 604800, // 7 days (in seconds)
  MFA_TOKEN: 300, // 5 minutes (in seconds)
} as const;

export type DefaultTokenTTL = (typeof DefaultTokenTTL)[keyof typeof DefaultTokenTTL];
