import type {
  TelemetrySafetyGateEvent,
  TelemetrySafetyGateInput
} from "@bidayax/types";
import { sanitizeMetadata } from "./telemetry-sanitizer";

export function createTelemetrySafetyGateEvent(
  input: TelemetrySafetyGateInput
): TelemetrySafetyGateEvent {
  return {
    correlationId: input.correlationId ?? null,
    createdAt: new Date().toISOString(),
    decision: input.decision,
    gateName: input.gateName,
    metadata: sanitizeMetadata(input.metadata),
    reasonCodes: [...input.reasonCodes],
    subsystem: input.subsystem
  };
}

