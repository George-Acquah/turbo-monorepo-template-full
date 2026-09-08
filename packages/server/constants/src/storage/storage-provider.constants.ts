export const StorageProviders = {
  LOCAL: 'local',
  S3: 's3',
  R2: 'r2',
  SUPABASE: 'supabase',
} as const;

export type StorageProvider = (typeof StorageProviders)[keyof typeof StorageProviders];
