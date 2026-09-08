export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function createObjectBuilder<T extends object>(defaults: () => T) {
  return (overrides: Partial<T> = {}): T => ({
    ...defaults(),
    ...overrides,
  });
}
