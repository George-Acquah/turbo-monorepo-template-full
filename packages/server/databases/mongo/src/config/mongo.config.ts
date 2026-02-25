import { registerAs } from '@nestjs/config';

export const mongoConfigKey = 'mongoConfig';

export const mongoConfig = registerAs(mongoConfigKey, () => ({
  uri: process.env.MONGODB_URI ?? process.env.MONGO_URI ?? '',
  dbName: process.env.MONGODB_DB_NAME || undefined,
  maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE ?? '20'),
  minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE ?? '2'),
  serverSelectionTimeoutMs: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? '10000'),
}));
