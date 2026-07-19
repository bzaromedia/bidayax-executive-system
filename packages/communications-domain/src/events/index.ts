import type { CommunicationChannel } from "../types";

export const communicationEventVersion = "1" as const;

export const communicationEventTypes = [
  "communication.requested",
  "communication.policy_checked",
  "communication.authorized",
  "communication.blocked",
  "communication.queued",
  "communication.dispatched",
  "communication.accepted",
  "communication.active",
  "communication.completed",
  "communication.failed",
  "communication.cancelled",
  "communication.escalated",
  "communication.suppressed",
  "communication.kill_switch_applied",
  "communication.adapter_degraded",
  "communication.adapter_recovered"
] as const;

export type CommunicationEventType = (typeof communicationEventTypes)[number];

export type CommunicationEventEnvelope = {
  readonly version: typeof communicationEventVersion;
  readonly eventId: string;
  readonly eventType: CommunicationEventType;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string | null;
  readonly channel: CommunicationChannel | null;
  readonly occurredAt: string;
  readonly reasonCode: string;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
};
