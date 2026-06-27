import { maskPhoneNumber } from "./runtime-flags";

export type LogLevel = "info" | "warn" | "error";

export type LoggerContext = {
  readonly component: string;
  readonly correlationId?: string | null;
};

const sensitiveKeys = [
  "authorization",
  "token",
  "secret",
  "password",
  "apiKey",
  "authToken",
  "rawBody",
  "payload"
];

function sanitizeValue(key: string, value: unknown): unknown {
  if (sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
    return "[redacted]";
  }

  if (key.toLowerCase().includes("phone") || key.toLowerCase().includes("number")) {
    return typeof value === "string" ? maskPhoneNumber(value) : value;
  }

  return value;
}

export function createLogger(context: LoggerContext) {
  return function log(
    level: LogLevel,
    event: string,
    details: Record<string, unknown> = {}
  ) {
    const sanitizedDetails = Object.fromEntries(
      Object.entries(details).map(([key, value]) => [key, sanitizeValue(key, value)])
    );

    console[level](
      JSON.stringify({
        component: context.component,
        correlationId: context.correlationId ?? null,
        event,
        level,
        timestamp: new Date().toISOString(),
        ...sanitizedDetails
      })
    );
  };
}
