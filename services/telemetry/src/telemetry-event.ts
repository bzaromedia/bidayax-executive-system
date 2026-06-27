import type { TelemetryEvent, TelemetryEventInput } from "@bidayax/types";
import { sanitizeMetadata } from "./telemetry-sanitizer";

export function createTelemetryEvent(input: TelemetryEventInput): TelemetryEvent {
  return {
    anonymousVisitorId: input.anonymousVisitorId ?? null,
    correlationId: input.correlationId ?? null,
    createdAt: new Date().toISOString(),
    durationMs: input.durationMs ?? null,
    eventName: input.eventName,
    executiveSlug: input.executiveSlug ?? null,
    metadata: sanitizeMetadata(input.metadata),
    sessionId: input.sessionId ?? null,
    severity: input.severity ?? "info",
    status: input.status,
    subsystem: input.subsystem
  };
}

