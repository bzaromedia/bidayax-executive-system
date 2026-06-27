import type {
  OutboundCallRequestInput,
  PreparedOutboundCallRequest,
  TelephonyRuntimeConfig
} from "@bidayax/types";
import { evaluateOutboundCallSafety } from "./telephony-safety-gates";

export function createOutboundCallRequest(
  input: OutboundCallRequestInput,
  config: TelephonyRuntimeConfig
): PreparedOutboundCallRequest {
  const approvalStatus = config.requireHumanApproval
    ? "pending"
    : config.provider === "mock"
      ? "not_required_for_mock"
      : "pending";
  const safety = evaluateOutboundCallSafety({
    approvalStatus,
    config
  });

  return {
    approvalStatus,
    executiveSlug: input.executiveSlug,
    reason: input.reason,
    requestedBy: input.requestedBy,
    safetyReasons: safety.reasonCodes,
    status: safety.allowed ? "ready_for_provider" : "pending_approval",
    toNumber: input.toNumber
  };
}
