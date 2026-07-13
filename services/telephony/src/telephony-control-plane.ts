import type {
  TelephonyAppointmentRequest,
  TelephonyCallbackRequest,
  CallSession,
  TelephonyControlPlaneResult,
  TelephonyParty
} from "@bidayax/types";
import type { TelephonyDomainRepository } from "./domain-repository";
import { createUsageLedgerEntry } from "./usage-ledger";

export type TelephonyControlPlaneInput = {
  readonly tenantId: string;
  readonly cardId: string;
  readonly phoneNumberId: string;
  readonly sessionId: string;
  readonly direction: "inbound" | "outbound";
  readonly caller: TelephonyParty;
  readonly callee: TelephonyParty;
  readonly requestedAt: string;
  readonly actorId: string;
};

export async function requestCallSession({
  input,
  repository
}: {
  readonly input: TelephonyControlPlaneInput;
  readonly repository: TelephonyDomainRepository;
}): Promise<TelephonyControlPlaneResult> {
  const session: CallSession = {
    caller: input.caller,
    callee: input.callee,
    cardId: input.cardId,
    direction: input.direction,
    durationSeconds: null,
    endTime: null,
    metadata: { providerIndependent: true, productionCallingEnabled: false },
    outcome: null,
    phoneNumberId: input.phoneNumberId,
    recordingReference: null,
    sessionId: input.sessionId,
    startTime: input.requestedAt,
    state: "requested",
    tenantId: input.tenantId,
    transcriptReference: null
  };

  const auditEvent = {
    actor: {
      actorId: input.actorId,
      actorType: "system" as const,
      displayName: "Telephony Control Plane"
    },
    cardId: input.cardId,
    eventId: input.sessionId + ":telephony.call.requested",
    eventType: "telephony.call.requested",
    metadata: {
      direction: input.direction,
      providerIndependent: true,
      productionCallingEnabled: false
    },
    occurredAt: input.requestedAt,
    sessionId: input.sessionId,
    severity: "info" as const,
    tenantId: input.tenantId
  };

  const usageEntry = createUsageLedgerEntry({
    cardId: input.cardId,
    category: "provider_minutes",
    ledgerEntryId: input.sessionId + ":usage.requested",
    metadata: { providerCostPending: true, liveProviderConfigured: false },
    occurredAt: input.requestedAt,
    quantity: 0,
    sessionId: input.sessionId,
    tenantId: input.tenantId,
    unit: "minute"
  });

  await repository.saveCallSession(session);
  await repository.appendAuditEvent(auditEvent);
  await repository.appendUsageLedgerEntry(usageEntry);

  return {
    accepted: true,
    auditEvents: [auditEvent],
    reasonCodes: ["PROVIDER_INDEPENDENT_CALL_SESSION_CREATED"],
    status: "queued",
    usageEntries: [usageEntry]
  };
}

export async function queueTelephonyCallbackRequest({
  repository,
  request
}: {
  readonly repository: TelephonyDomainRepository;
  readonly request: TelephonyCallbackRequest;
}) {
  await repository.saveTelephonyCallbackRequest(request);
  await repository.appendAuditEvent({
    actor: {
      actorId: "telephony-control-plane",
      actorType: "system",
      displayName: "Telephony Control Plane"
    },
    cardId: request.cardId,
    eventId: request.callbackRequestId + ":telephony.callback.requested",
    eventType: "telephony.callback.requested",
    metadata: { state: request.state, priorityScore: request.priorityScore },
    occurredAt: request.createdAt,
    sessionId: request.sessionId ?? null,
    severity: "info",
    tenantId: request.tenantId
  });

  return request;
}

export async function queueTelephonyAppointmentRequest({
  repository,
  request
}: {
  readonly repository: TelephonyDomainRepository;
  readonly request: TelephonyAppointmentRequest;
}) {
  await repository.saveTelephonyAppointmentRequest(request);
  await repository.appendAuditEvent({
    actor: {
      actorId: "telephony-control-plane",
      actorType: "system",
      displayName: "Telephony Control Plane"
    },
    cardId: request.cardId,
    eventId: request.appointmentRequestId + ":telephony.appointment.requested",
    eventType: "telephony.appointment.requested",
    metadata: { state: request.state, timezone: request.timezone },
    occurredAt: request.createdAt,
    sessionId: request.sessionId ?? null,
    severity: "info",
    tenantId: request.tenantId
  });

  return request;
}
