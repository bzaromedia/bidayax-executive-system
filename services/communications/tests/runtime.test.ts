import { describe, expect, it } from "vitest";
import {
  createPhase11aBlockedEvent,
  createPhase11aBlockedTrustEvidence,
  createPhase11aDisabledAcceptance,
  phase11aCommunicationsApi,
  phase11aCommunicationsOrchestrator,
  phase11aExecutionDisabledReasonCode
} from "../src/runtime";

describe("phase 11A disabled communications boundary", () => {
  it("returns a blocked acceptance for application-facing telephony requests", () => {
    const acceptance = createPhase11aDisabledAcceptance({
      channel: "telephony",
      surface: "outbound_telephony_request"
    });

    expect(acceptance.accepted).toBe(false);
    expect(acceptance.communicationId).toBeNull();
    expect(acceptance.reasonCodes).toEqual([
      "PHASE_11A_EXECUTION_DISABLED:telephony:outbound_telephony_request"
    ]);
  });

  it("creates a blocked event and trust evidence without transport execution", () => {
    const event = createPhase11aBlockedEvent({
      channel: "telephony",
      surface: "twilio_inbound_webhook",
      tenantId: "tenant-1",
      cardId: null,
      communicationId: null,
      adapterId: "telephony.sandbox.adapter"
    });
    const evidence = createPhase11aBlockedTrustEvidence(event);

    expect(event.eventType).toBe("communication.blocked");
    expect(event.reasonCode).toBe(phase11aExecutionDisabledReasonCode);
    expect(event.tenantId).toBe("tenant-1");
    expect(event.metadata.adapterId).toBe("telephony.sandbox.adapter");
    expect(evidence.subjectId).toBe("communications.phase11a.disabled-boundary");
    expect(evidence.tenantId).toBe("tenant-1");
    expect(evidence.attributes.surface).toBe("twilio_inbound_webhook");
  });

  it("fails closed when a blocked event is created without a tenant identity", () => {
    expect(() =>
      createPhase11aBlockedEvent({
        channel: "telephony",
        surface: "communications_command",
        tenantId: "   ",
        cardId: null,
        communicationId: null
      })
    ).toThrow("Communications runtime requires a non-empty tenantId");
  });

  it("keeps the communications api and orchestrator in a disabled state for phase 11A", async () => {
    const command = {
      actorId: "executor",
      cardId: null,
      idempotencyKey: "phase11a-disabled-test",
      payload: {
        participantId: "participant-1",
        reason: "test",
        requestedChannelOrder: ["telephony"]
      },
      requestedAt: "2026-07-19T00:00:00.000Z",
      tenantId: "tenant-1",
      type: "initiate_communication"
    } as const;

    const acceptance = await phase11aCommunicationsApi.dispatch(command);
    const reasons = await phase11aCommunicationsOrchestrator.authorize(command);
    const event = await phase11aCommunicationsOrchestrator.dispatch(command);

    expect(acceptance.accepted).toBe(false);
    expect(reasons).toEqual([phase11aExecutionDisabledReasonCode]);
    expect(event.eventType).toBe("communication.blocked");
    expect(event.channel).toBe("telephony");
    expect(event.tenantId).toBe("tenant-1");
  });

  it("fails closed when a communications command omits tenant identity", async () => {
    const command = {
      actorId: "executor",
      cardId: null,
      idempotencyKey: "phase11a-missing-tenant",
      payload: {
        participantId: "participant-1",
        reason: "missing-tenant-check",
        requestedChannelOrder: ["telephony"]
      },
      requestedAt: "2026-07-19T00:00:00.000Z",
      tenantId: "",
      type: "initiate_communication"
    } as const;

    await expect(phase11aCommunicationsOrchestrator.dispatch(command)).rejects.toThrow(
      "Communications runtime requires a non-empty tenantId"
    );
  });

  it("preserves adapter-event channel, adapter identity, and tenant identity", async () => {
    const event = await phase11aCommunicationsOrchestrator.processNormalizedAdapterEvent({
      adapterId: "telephony.sandbox.adapter",
      adapterReference: "attempt-1",
      cardId: null,
      channel: "telephony",
      communicationId: "comm-1",
      eventId: "adapter-event-1",
      eventType: "communication.accepted",
      metadata: {
        deliveryAttempt: 1
      },
      occurredAt: "2026-07-19T00:00:00.000Z",
      tenantId: "tenant-1",
      transportState: "ringing"
    });

    expect(event.channel).toBe("telephony");
    expect(event.tenantId).toBe("tenant-1");
    expect(event.metadata.adapterId).toBe("telephony.sandbox.adapter");
  });

  it("fails closed when a normalized adapter event omits tenant identity", async () => {
    await expect(
      phase11aCommunicationsOrchestrator.processNormalizedAdapterEvent({
        adapterId: "telephony.sandbox.adapter",
        adapterReference: "attempt-1",
        cardId: null,
        channel: "telephony",
        communicationId: "comm-1",
        eventId: "adapter-event-1",
        eventType: "communication.accepted",
        metadata: {
          deliveryAttempt: 1
        },
        occurredAt: "2026-07-19T00:00:00.000Z",
        tenantId: "  ",
        transportState: "ringing"
      })
    ).rejects.toThrow("Communications runtime requires a non-empty tenantId");
  });
});
