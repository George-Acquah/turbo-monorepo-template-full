import type { TransformFnParams } from 'class-transformer';
import {
  LOG_LEVELS,
  NODE_ENVS,
  STORAGE_PROVIDERS,
  STORE_DRIVERS,
  type LogLevel,
  type NodeEnv,
  type StorageProvider,
  type StoreDriver,
} from './types';

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function toOptionalString({ value }: TransformFnParams): string | undefined {
  return normalizeString(value);
}

export function toStringWithDefault(defaultValue: string) {
  return ({ value }: TransformFnParams): string => normalizeString(value) ?? defaultValue;
}

export function toBooleanWithDefault(defaultValue = false) {
  return ({ value }: TransformFnParams): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }

    const normalized = normalizeString(value)?.toLowerCase();
    if (!normalized) {
      return defaultValue;
    }

    return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
  };
}

export function toNumberWithDefault(defaultValue: number) {
  return ({ value }: TransformFnParams): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const normalized = normalizeString(value);
    if (!normalized) {
      return defaultValue;
    }

    return Number(normalized);
  };
}

export function toStringArrayWithDefault(defaultValue: readonly string[]) {
  return ({ value }: TransformFnParams): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean);
    }

    const normalized = normalizeString(value);
    if (!normalized) {
      return [...defaultValue];
    }

    return normalized
      .split(/[,\s]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  };
}

export function toStoreDriverWithDefault(defaultValue: StoreDriver) {
  return ({ value }: TransformFnParams): StoreDriver => {
    const normalized = normalizeString(value)?.toLowerCase() as StoreDriver | undefined;
    return normalized && STORE_DRIVERS.includes(normalized) ? normalized : defaultValue;
  };
}

export function toOptionalStoreDriver({ value }: TransformFnParams): StoreDriver | undefined {
  const normalized = normalizeString(value)?.toLowerCase() as StoreDriver | undefined;
  return normalized && STORE_DRIVERS.includes(normalized) ? normalized : undefined;
}

export function toStorageProviderWithDefault(defaultValue: StorageProvider) {
  return ({ value }: TransformFnParams): StorageProvider => {
    const normalized = normalizeString(value)?.toLowerCase() as StorageProvider | undefined;
    return normalized && STORAGE_PROVIDERS.includes(normalized) ? normalized : defaultValue;
  };
}

export function toNodeEnvWithDefault(defaultValue: NodeEnv) {
  return ({ value }: TransformFnParams): NodeEnv => {
    const normalized = normalizeString(value)?.toLowerCase() as NodeEnv | undefined;
    return normalized && NODE_ENVS.includes(normalized) ? normalized : defaultValue;
  };
}

export function toLogLevelWithDefault(defaultValue: LogLevel) {
  return ({ value }: TransformFnParams): LogLevel => {
    const normalized = normalizeString(value)?.toLowerCase() as LogLevel | undefined;
    return normalized && LOG_LEVELS.includes(normalized) ? normalized : defaultValue;
  };
}
