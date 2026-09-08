export const MaxLimits = {
  BATCH_SIZE: 100,
  FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  IMPORT_ROW_LIMIT: 5000,
} as const;

export type MaxLimits = (typeof MaxLimits)[keyof typeof MaxLimits];
