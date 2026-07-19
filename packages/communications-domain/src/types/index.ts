export const communicationDomainVersion = "phase-11a.v1" as const;

export const communicationChannels = [
  "telephony",
  "voice",
  "messaging",
  "scheduling",
  "custom"
] as const;

export type CommunicationChannel = (typeof communicationChannels)[number];

export const communicationExecutionModes = [
  "disabled",
  "sandbox_only",
  "future_live"
] as const;

export type CommunicationExecutionMode =
  (typeof communicationExecutionModes)[number];

export const communicationAdapterCapabilities = [
  "capability_discovery",
  "command_submission",
  "command_cancellation",
  "health_reporting",
  "idempotent_dispatch",
  "normalized_events",
  "normalized_status",
  "sandbox_dispatch",
  "shutdown"
] as const;

export type CommunicationAdapterCapability =
  (typeof communicationAdapterCapabilities)[number];

export type TenantScopedCommunicationReference = {
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string | null;
};

export type NormalizedCommunicationStatus = {
  readonly channel: CommunicationChannel;
  readonly communicationId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly normalizedState: string;
  readonly transportState: string | null;
  readonly adapterReference: string | null;
  readonly occurredAt: string;
  readonly reasonCode: string;
};

export type NormalizedAdapterEvent = {
  readonly eventId: string;
  readonly eventType: string;
  readonly channel: CommunicationChannel;
  readonly adapterId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string | null;
  readonly adapterReference: string | null;
  readonly occurredAt: string;
  readonly transportState: string | null;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
};

export type ProviderNeutralWebhookEvidenceDraft = {
  readonly eventId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly channel: CommunicationChannel;
  readonly providerAccountReference: string;
  readonly providerEventId: string;
  readonly payloadHash: string;
  readonly rawBodyRetainedForVerification: true;
  readonly acceptedAt: string;
};

export type AdapterHealthSnapshot = {
  readonly adapterId: string;
  readonly channel: CommunicationChannel;
  readonly status: "healthy" | "degraded" | "unavailable";
  readonly checkedAt: string;
  readonly reasonCodes: readonly string[];
};

export type CommunicationChannelAdapterContract = {
  readonly adapterId: string;
  readonly channel: CommunicationChannel;
  readonly executionMode: CommunicationExecutionMode;
  readonly supportedCommands: readonly string[];
  readonly normalizedEvents: readonly string[];
  readonly transportStates: readonly string[];
  readonly capabilities: readonly CommunicationAdapterCapability[];
  readonly requiresRawBodyVerification: boolean;
  readonly requiresIdempotencyKeys: boolean;
  readonly requiresCommunicationsAuthorization: boolean;
  readonly requiresCommunicationsPolicyGate: boolean;
  readonly transportOwnedConcerns: readonly string[];
  readonly prohibitedOwnership: readonly string[];
};

export type ReceptionistCommunicationsBoundary = {
  readonly boundaryId: string;
  readonly ownedConcerns: readonly string[];
  readonly prohibitedConcerns: readonly string[];
  readonly requiresCommunicationsPolicyGate: boolean;
  readonly canDispatchProvidersDirectly: false;
};