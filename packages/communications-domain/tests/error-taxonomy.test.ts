import { describe, expect, it } from "vitest";
import {
  CommunicationDomainError,
  communicationErrorCodes
} from "../src/errors";

describe("communications error taxonomy", () => {
  it("defines the required transport-neutral error set", () => {
    expect(communicationErrorCodes).toEqual([
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
    ]);
  });

  it("surfaces structured domain errors", () => {
    const error = new CommunicationDomainError(
      "kill_switch_active",
      "Tenant kill switch is active."
    );

    expect(error.code).toBe("kill_switch_active");
    expect(error.message).toBe("Tenant kill switch is active.");
  });
});
