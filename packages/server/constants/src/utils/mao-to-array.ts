export const v = <T extends Record<string, string>>(o: T) => Object.values(o) as readonly string[];
