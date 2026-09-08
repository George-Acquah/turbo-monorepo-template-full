const sensitiveKeys = ["token", "authorization", "email", "password", "secret", "cookie"];

export function redactSensitive(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitive);
  }

  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).map(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        return [key, "[REDACTED]"];
      }

      return [key, redactSensitive(value)];
    }),
  );
}
