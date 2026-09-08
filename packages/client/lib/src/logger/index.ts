import { redactSensitive } from "./redact";

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerPayload {
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

function serialize(level: LogLevel, payload: LoggerPayload) {
  const redactedContext = payload.context ? redactSensitive(payload.context) : undefined;
  const redactedError = payload.error ? redactSensitive(payload.error) : undefined;

  return {
    level,
    timestamp: new Date().toISOString(),
    runtime: typeof window === "undefined" ? "server" : "client",
    message: payload.message,
    context: redactedContext,
    error: redactedError,
  };
}

function emit(level: LogLevel, payload: LoggerPayload): void {
  const logEntry = serialize(level, payload);

  if (typeof window !== "undefined" && level === "debug") {
    return;
  }

  const output = JSON.stringify(logEntry);

  if (level === "error") {
    console.error(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.log(output);
}


export const logger = {
  debug: (payload: LoggerPayload) => emit("debug", payload),
  info: (payload: LoggerPayload) => emit("info", payload),
  warn: (payload: LoggerPayload) => emit("warn", payload),
  error: (payload: LoggerPayload) => emit("error", payload),
};

