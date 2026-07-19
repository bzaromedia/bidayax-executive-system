import type {
  CommunicationChannel,
  CommunicationCommand,
  CommunicationEventEnvelope,
  CommunicationTrustEvidenceDraft,
  NormalizedAdapterEvent
} from "@bidayax/communications-domain";
import { communicationEventVersion } from "@bidayax/communications-domain";
import type { CommunicationsApi, CommunicationsApiAcceptance } from "../api";
import type { CommunicationsOrchestrator } from "../orchestrator";

export const phase11aExecutionDisabledReasonCode =
  "PHASE_11A_EXECUTION_DISABLED" as const;

export const phase11aExecutionDisabledReasonCodes = [
  phase11aExecutionDisabledReasonCode
] as const;

export const phase11aBlockedSurfaces = [
  "inbound_telephony_webhook",
  "outbound_telephony_request",
  "twilio_inbound_webhook",
  "communications_command",
  "adapter_event"
] as const;

export type Phase11aBlockedSurface = (typeof phase11aBlockedSurfaces)[number];

function resolveChannelCandidate(
  candidate: unknown
): CommunicationChannel | null {
  return candidate === "telephony" ||
    candidate === "voice" ||
    candidate === "messaging" ||
    candidate === "scheduling" ||
    candidate === "custom"
    ? candidate
    : null;
}

function resolveCommandChannel(command: CommunicationCommand): CommunicationChannel | null {
  const payload = command.payload as Record<string, unknown>;

  return (
    resolveChannelCandidate(payload["channel"]) ??
    (Array.isArray(payload["requestedChannelOrder"])
      ? resolveChannelCandidate(payload["requestedChannelOrder"][0])
      : null) ??
    (Array.isArray(payload["preferredChannelOrder"])
      ? resolveChannelCandidate(payload["preferredChannelOrder"][0])
      : null)
  );
}

function requireTenantId(tenantId: string): string {
  if (tenantId.trim().length === 0) {
    throw new Error("Communications runtime requires a non-empty tenantId");
  }

  return tenantId;
}

export function createPhase11aDisabledAcceptance(input: {
  readonly channel: CommunicationChannel;
  readonly surface: Phase11aBlockedSurface;
}): CommunicationsApiAcceptance {
  return {
    accepted: false,
    communicationId: null,
    reasonCodes: phase11aExecutionDisabledReasonCodes.map(
      (reasonCode) => `${reasonCode}:${input.channel}:${input.surface}`
    )
  };
}

export function createPhase11aBlockedEvent(input: {
  readonly channel: CommunicationChannel | null;
  readonly surface: Phase11aBlockedSurface;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string | null;
  readonly adapterId?: string | null;
}): CommunicationEventEnvelope {
  const tenantId = requireTenantId(input.tenantId);

  return {
    version: communicationEventVersion,
    eventId: `phase11a-blocked:${input.surface}:${tenantId}`,
    eventType: "communication.blocked",
    tenantId,
    cardId: input.cardId,
    communicationId: input.communicationId,
    channel: input.channel,
    occurredAt: new Date().toISOString(),
    reasonCode: phase11aExecutionDisabledReasonCode,
    metadata: {
      adapterId: input.adapterId ?? null,
      executionEnabled: false,
      phase: "11A",
      surface: input.surface
    }
  };
}

export function createPhase11aBlockedTrustEvidence(
  event: CommunicationEventEnvelope
): CommunicationTrustEvidenceDraft {
  return {
    tenantId: event.tenantId,
    cardId: event.cardId,
    communicationId: event.communicationId,
    channel: event.channel,
    eventType: event.eventType,
    reasonCode: event.reasonCode,
    occurredAt: event.occurredAt,
    subjectId: "communications.phase11a.disabled-boundary",
    attributes: event.metadata
  };
}

export const phase11aCommunicationsApi: CommunicationsApi = {
  async dispatch(command) {
    return createPhase11aDisabledAcceptance({
      channel: resolveCommandChannel(command) ?? "custom",
      surface: "communications_command"
    });
  }
};

export const phase11aCommunicationsOrchestrator: CommunicationsOrchestrator = {
  async authorize() {
    return phase11aExecutionDisabledReasonCodes;
  },
  async dispatch(command) {
    return createPhase11aBlockedEvent({
      channel: resolveCommandChannel(command),
      surface: "communications_command",
      tenantId: requireTenantId(command.tenantId),
      cardId: command.cardId,
      communicationId: null
    });
  },
  async createTrustEvidence(event) {
    return createPhase11aBlockedTrustEvidence(event);
  },
  async processNormalizedAdapterEvent(event: NormalizedAdapterEvent) {
    return createPhase11aBlockedEvent({
      channel: event.channel,
      surface: "adapter_event",
      tenantId: requireTenantId(event.tenantId),
      cardId: event.cardId,
      communicationId: event.communicationId,
      adapterId: event.adapterId
    });
  }
};
