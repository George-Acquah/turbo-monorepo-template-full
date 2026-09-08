export const HashAlgorithms = {
  ARGON2ID: 'argon2id',
  SHA256: 'sha256',
} as const;

export type HashAlgorithm = (typeof HashAlgorithms)[keyof typeof HashAlgorithms];
