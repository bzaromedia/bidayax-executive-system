import type { CommunicationChannelAdapterContract } from "@bidayax/communications-domain";

export const telephonyChannelAdapterContract = {
  adapterId: "telephony.channel.adapter",
  capabilities: [
    "capability_discovery",
    "command_submission",
    "command_cancellation",
    "health_reporting",
    "idempotent_dispatch",
    "normalized_events",
    "normalized_status",
    "sandbox_dispatch",
    "shutdown"
  ],
  channel: "telephony",
  executionMode: "sandbox_only",
  normalizedEvents: [
    "communication.dispatched",
    "communication.accepted",
    "communication.active",
    "communication.completed",
    "communication.failed",
    "communication.cancelled",
    "communication.adapter_degraded",
    "communication.adapter_recovered"
  ],
  prohibitedOwnership: [
    "tenant_authorization",
    "consent_policy",
    "suppression_policy",
    "receptionist_routing_policy",
    "cross_channel_orchestration",
    "audit_policy",
    "trust_policy",
    "fraud_policy_decisions",
    "provider_selection_policy",
    "production_activation_authority"
  ],
  requiresCommunicationsAuthorization: true,
  requiresCommunicationsPolicyGate: true,
  requiresIdempotencyKeys: true,
  requiresRawBodyVerification: true,
  supportedCommands: [
    "request_callback",
    "initiate_communication",
    "accept_inbound_communication_event",
    "terminate_communication",
    "query_communication_status"
  ],
  transportOwnedConcerns: [
    "telephone_call_transport",
    "provider_call_identifiers",
    "phone_number_capabilities",
    "ringing_and_answer_events",
    "telephony_session_metadata",
    "dtmf",
    "pstn_or_sip_specific_data",
    "carrier_response_normalization",
    "call_leg_details",
    "provider_telephony_webhook_translation",
    "telephony_adapter_health"
  ],
  transportStates: [
    "ringing",
    "busy",
    "no_answer",
    "voicemail",
    "carrier_rejected",
    "provider_accepted"
  ]
} as const satisfies CommunicationChannelAdapterContract;
