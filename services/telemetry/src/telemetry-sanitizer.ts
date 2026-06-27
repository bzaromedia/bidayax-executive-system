import type { TelemetryMetadata } from "@bidayax/types";
import { maskPhoneNumber } from "@bidayax/config";

const redacted = "[redacted]";
const sensitiveKeyFragments = [
  "authorization",
  "token",
  "secret",
  "password",
  "api_key",
  "apikey",
  "auth",
  "rawbody",
  "payload",
  "recording",
  "audio"
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeValue(key: string, value: unknown): unknown {
  const normalizedKey = key.replace(/[_-]/g, "").toLowerCase();

  if (sensitiveKeyFragments.some((fragment) => normalizedKey.includes(fragment))) {
    return redacted;
  }

  if (normalizedKey.includes("phone") || normalizedKey.includes("number")) {
    return typeof value === "string" ? maskPhoneNumber(value) : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item));
  }

  if (isPlainObject(value)) {
    return sanitizeMetadata(value);
  }

  if (
    typeof value === "string" &&
    /(sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+|Basic\s+\S+)/.test(value)
  ) {
    return redacted;
  }

  return value;
}

export function sanitizeMetadata(
  metadata: TelemetryMetadata | Record<string, unknown> | undefined
): TelemetryMetadata {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, sanitizeValue(key, value)])
  );
}

