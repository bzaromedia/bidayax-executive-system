import type { CommunicationChannel } from "../types";

export const communicationCommandTypes = [
  "request_callback",
  "cancel_callback",
  "schedule_communication",
  "initiate_communication",
  "accept_inbound_communication_event",
  "escalate_to_human",
  "suppress_communication",
  "release_suppression",
  "evaluate_consent",
  "evaluate_business_hours",
  "evaluate_routing",
  "query_communication_status",
  "terminate_communication",
  "apply_tenant_kill_switch",
  "apply_platform_kill_switch"
] as const;

export type CommunicationCommandType =
  (typeof communicationCommandTypes)[number];

export type CommunicationCommandEnvelope<
  TType extends CommunicationCommandType,
  TPayload
> = {
  readonly type: TType;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly idempotencyKey: string;
  readonly requestedAt: string;
  readonly actorId: string;
  readonly payload: TPayload;
};

export type RequestCallbackPayload = {
  readonly participantId: string;
  readonly reason: string;
  readonly preferredChannelOrder: readonly CommunicationChannel[];
  readonly requestedTime: string | null;
};

export type CancelCallbackPayload = {
  readonly callbackRequestId: string;
  readonly reason: string;
};

export type ScheduleCommunicationPayload = {
  readonly participantId: string;
  readonly channel: CommunicationChannel;
  readonly scheduledFor: string;
  readonly reason: string;
};

export type InitiateCommunicationPayload = {
  readonly participantId: string;
  readonly requestedChannelOrder: readonly CommunicationChannel[];
  readonly reason: string;
};

export type AcceptInboundCommunicationEventPayload = {
  readonly channel: CommunicationChannel;
  readonly providerEventId: string;
  readonly providerAccountReference: string;
  readonly rawBodyReference: string;
  readonly receivedAt: string;
};

export type EscalateToHumanPayload = {
  readonly communicationId: string;
  readonly escalationReason: string;
  readonly targetQueue: string | null;
};

export type SuppressCommunicationPayload = {
  readonly participantId: string;
  readonly reason: string;
  readonly expiresAt: string | null;
};

export type ReleaseCommunicationSuppressionPayload = {
  readonly suppressionId: string;
  readonly reason: string;
};

export type EvaluateCommunicationConsentPayload = {
  readonly participantId: string;
  readonly channel: CommunicationChannel;
  readonly purpose: string;
};

export type EvaluateBusinessHoursPayload = {
  readonly routingProfileId: string;
  readonly evaluatedAt: string;
};

export type EvaluateRoutingPayload = {
  readonly participantId: string;
  readonly requestedChannelOrder: readonly CommunicationChannel[];
  readonly reason: string;
};

export type QueryCommunicationStatusPayload = {
  readonly communicationId: string;
};

export type TerminateCommunicationPayload = {
  readonly communicationId: string;
  readonly reason: string;
};

export type ApplyTenantKillSwitchPayload = {
  readonly reason: string;
  readonly mode: "read_only" | "stop_dispatch";
};

export type ApplyPlatformKillSwitchPayload = {
  readonly reason: string;
  readonly mode: "read_only" | "stop_dispatch";
};

export type RequestCallbackCommand = CommunicationCommandEnvelope<
  "request_callback",
  RequestCallbackPayload
>;
export type CancelCallbackCommand = CommunicationCommandEnvelope<
  "cancel_callback",
  CancelCallbackPayload
>;
export type ScheduleCommunicationCommand = CommunicationCommandEnvelope<
  "schedule_communication",
  ScheduleCommunicationPayload
>;
export type InitiateCommunicationCommand = CommunicationCommandEnvelope<
  "initiate_communication",
  InitiateCommunicationPayload
>;
export type AcceptInboundCommunicationEventCommand = CommunicationCommandEnvelope<
  "accept_inbound_communication_event",
  AcceptInboundCommunicationEventPayload
>;
export type EscalateToHumanCommand = CommunicationCommandEnvelope<
  "escalate_to_human",
  EscalateToHumanPayload
>;
export type SuppressCommunicationCommand = CommunicationCommandEnvelope<
  "suppress_communication",
  SuppressCommunicationPayload
>;
export type ReleaseCommunicationSuppressionCommand =
  CommunicationCommandEnvelope<
    "release_suppression",
    ReleaseCommunicationSuppressionPayload
  >;
export type EvaluateCommunicationConsentCommand = CommunicationCommandEnvelope<
  "evaluate_consent",
  EvaluateCommunicationConsentPayload
>;
export type EvaluateBusinessHoursCommand = CommunicationCommandEnvelope<
  "evaluate_business_hours",
  EvaluateBusinessHoursPayload
>;
export type EvaluateRoutingCommand = CommunicationCommandEnvelope<
  "evaluate_routing",
  EvaluateRoutingPayload
>;
export type QueryCommunicationStatusCommand = CommunicationCommandEnvelope<
  "query_communication_status",
  QueryCommunicationStatusPayload
>;
export type TerminateCommunicationCommand = CommunicationCommandEnvelope<
  "terminate_communication",
  TerminateCommunicationPayload
>;
export type ApplyTenantKillSwitchCommand = CommunicationCommandEnvelope<
  "apply_tenant_kill_switch",
  ApplyTenantKillSwitchPayload
>;
export type ApplyPlatformKillSwitchCommand = CommunicationCommandEnvelope<
  "apply_platform_kill_switch",
  ApplyPlatformKillSwitchPayload
>;

export type CommunicationCommand =
  | RequestCallbackCommand
  | CancelCallbackCommand
  | ScheduleCommunicationCommand
  | InitiateCommunicationCommand
  | AcceptInboundCommunicationEventCommand
  | EscalateToHumanCommand
  | SuppressCommunicationCommand
  | ReleaseCommunicationSuppressionCommand
  | EvaluateCommunicationConsentCommand
  | EvaluateBusinessHoursCommand
  | EvaluateRoutingCommand
  | QueryCommunicationStatusCommand
  | TerminateCommunicationCommand
  | ApplyTenantKillSwitchCommand
  | ApplyPlatformKillSwitchCommand;
