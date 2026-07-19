export const communicationErrorCodes = [
  "authorization_denied",
  "policy_blocked",
  "consent_missing",
  "suppression_active",
  "outside_business_hours",
  "no_eligible_channel",
  "no_eligible_adapter",
  "idempotency_conflict",
  "invalid_transition",
  "adapter_unavailable",
  "transient_execution_failure",
  "permanent_execution_failure",
  "kill_switch_active",
  "fraud_policy_blocked"
] as const;

export type CommunicationErrorCode = (typeof communicationErrorCodes)[number];

export class CommunicationDomainError extends Error {
  readonly code: CommunicationErrorCode;

  constructor(code: CommunicationErrorCode, message: string) {
    super(message);
    this.name = "CommunicationDomainError";
    this.code = code;
  }
}
