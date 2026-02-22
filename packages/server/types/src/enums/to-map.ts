// --- Helper to convert array to Object with Key-Value mapping ---
export const toMap = <T extends string>(arr: readonly T[]): { [K in T]: K } =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arr.reduce((acc, val) => ({ ...acc, [val]: val }), {} as any);
