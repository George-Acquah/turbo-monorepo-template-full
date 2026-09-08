export const MetadataKeys = {
  CORRELATION_ID: 'correlation_id',
} as const;

export type MetadataKey = (typeof MetadataKeys)[keyof typeof MetadataKeys];
