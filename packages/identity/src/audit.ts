import type { IdentityAuditEvent, IdentityAuditEventType } from "@bidayax/types";
import { deterministicIdentityId, sanitizeIdentityMetadata } from "./crypto";

export function createIdentityAuditEvent(input: {
  readonly eventType: IdentityAuditEventType;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly occurredAt?: string;
  readonly provider?: "workos";
  readonly reasonCode: string;
  readonly result: IdentityAuditEvent["result"];
  readonly sessionId?: string | null;
  readonly tenantId?: string | null;
  readonly userId?: string | null;
}): IdentityAuditEvent {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const metadata = sanitizeIdentityMetadata(input.metadata ?? {});
  return {
    eventId: deterministicIdentityId(
      input.eventType,
      input.userId ?? "anonymous",
      input.sessionId ?? "no-session",
      occurredAt,
      input.reasonCode
    ),
    eventType: input.eventType,
    metadata,
    occurredAt,
    provider: input.provider ?? "workos",
    reasonCode: input.reasonCode,
    result: input.result,
    ...(input.sessionId !== undefined ? { sessionId: input.sessionId } : {}),
    ...(input.tenantId !== undefined ? { tenantId: input.tenantId } : {}),
    ...(input.userId !== undefined ? { userId: input.userId } : {})
  };
}
