import type { TelemetryErrorEvent, TelemetryErrorInput } from "@bidayax/types";
import { sanitizeMetadata } from "./telemetry-sanitizer";

export function createTelemetryError(input: TelemetryErrorInput): TelemetryErrorEvent {
  return {
    correlationId: input.correlationId ?? null,
    createdAt: new Date().toISOString(),
    errorCategory: input.errorCategory,
    errorCode: input.errorCode,
    metadata: sanitizeMetadata(input.metadata),
    safeMessage: input.safeMessage,
    severity: input.severity ?? "error",
    subsystem: input.subsystem
  };
}

