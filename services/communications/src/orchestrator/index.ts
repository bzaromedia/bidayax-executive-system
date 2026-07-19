import type {
  CommunicationCommand,
  CommunicationEventEnvelope,
  CommunicationTrustEvidenceDraft,
  NormalizedAdapterEvent
} from "@bidayax/communications-domain";

export const communicationsOrchestratorResponsibilities = [
  "validate_identity_and_scope",
  "evaluate_communication_policy",
  "select_allowed_channel",
  "select_eligible_adapter",
  "create_idempotent_commands",
  "coordinate_state_transitions",
  "generate_audit_events",
  "generate_safe_trust_evidence",
  "dispatch_sandbox_work",
  "process_normalized_adapter_results",
  "enforce_retries_and_terminal_states",
  "honor_suppressions_and_kill_switches"
] as const;

export interface CommunicationsOrchestrator {
  authorize(command: CommunicationCommand): Promise<readonly string[]>;
  dispatch(command: CommunicationCommand): Promise<CommunicationEventEnvelope>;
  createTrustEvidence(
    event: CommunicationEventEnvelope
  ): Promise<CommunicationTrustEvidenceDraft>;
  processNormalizedAdapterEvent(
    event: NormalizedAdapterEvent
  ): Promise<CommunicationEventEnvelope>;
}
