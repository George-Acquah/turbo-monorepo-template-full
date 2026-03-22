import type { ValidatedServerEnv } from './types';

let validatedServerEnv: ValidatedServerEnv | undefined;

export function setValidatedServerEnv(env: ValidatedServerEnv): void {
  validatedServerEnv = deepFreeze(env);
}

export function getValidatedServerEnv(): ValidatedServerEnv {
  if (!validatedServerEnv) {
    throw new Error(
      'Validated server env is not initialized. Import ServerConfigModule.forRoot(...) before consuming config.',
    );
  }

  return validatedServerEnv;
}

export function resetValidatedServerEnvForTests(): void {
  validatedServerEnv = undefined;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object') {
    return value;
  }

  Object.freeze(value);

  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nestedValue);
  }

  return value;
}
