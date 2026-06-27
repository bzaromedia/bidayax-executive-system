import { randomUUID } from "node:crypto";

export const correlationIdHeader = "x-bidayax-correlation-id";

export function createCorrelationId() {
  return `corr_${randomUUID()}`;
}

export function getOrCreateCorrelationId(value?: string | null) {
  if (value && /^[A-Za-z0-9_-]{8,128}$/.test(value)) {
    return value;
  }

  return createCorrelationId();
}

