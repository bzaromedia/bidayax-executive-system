import type { ReceptionistCommunicationsBoundary } from "@bidayax/communications-domain";

export const receptionistCommunicationsBoundary = {
  boundaryId: "polyglot-receptionist.communications-boundary",
  canDispatchProvidersDirectly: false,
  ownedConcerns: [
    "intent_interpretation",
    "conversation_context",
    "language_selection",
    "receptionist_workflow_reasoning",
    "human_handoff_requests",
    "presentation_of_available_communication_actions"
  ],
  prohibitedConcerns: [
    "provider_dispatch",
    "communications_policy_bypass",
    "direct_transport_session_creation",
    "consent_override",
    "suppression_override",
    "production_communication_activation"
  ],
  requiresCommunicationsPolicyGate: true
} as const satisfies ReceptionistCommunicationsBoundary;
