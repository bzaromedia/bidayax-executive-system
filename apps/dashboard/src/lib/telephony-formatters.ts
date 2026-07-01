import type {
  OutboundCallApprovalStatus,
  OutboundCallRequestStatus,
  TelephonyCallEventType,
  TelephonyCallStatus,
  TelephonyProviderName,
  VoiceSessionStatus
} from "@bidayax/types";

export const telephonyProviderLabels = {
  mock: "Safety-gated future integration",
  twilio: "Twilio integration"
} as const satisfies Record<TelephonyProviderName, string>;

export const telephonyCallStatusLabels = {
  blocked: "Blocked",
  cancelled: "Cancelled",
  completed: "Completed",
  failed: "Failed",
  in_progress: "In progress",
  queued: "Queued",
  received: "Received",
  requires_approval: "Requires approval",
  ringing: "Ringing",
  simulated: "Simulated"
} as const satisfies Record<TelephonyCallStatus, string>;

export const telephonyEventLabels = {
  approval_denied: "Approval denied",
  approval_granted: "Approval granted",
  approval_required: "Approval required",
  call_completed: "Call completed",
  call_failed: "Call failed",
  call_in_progress: "Call in progress",
  call_linked_to_receptionist_interaction: "Linked to receptionist interaction",
  call_received: "Call received",
  call_started: "Call started",
  call_validated: "Call validated",
  outbound_call_blocked: "Outbound call blocked",
  outbound_call_requested: "Outbound call requested"
} as const satisfies Record<TelephonyCallEventType, string>;

export const voiceSessionStatusLabels = {
  active: "Active",
  blocked: "Blocked",
  completed: "Completed",
  failed: "Failed",
  not_started: "Not started",
  prepared: "Prepared"
} as const satisfies Record<VoiceSessionStatus, string>;

export const outboundApprovalLabels = {
  approved: "Approved",
  denied: "Denied",
  not_required_for_mock: "Provider approval not required",
  pending: "Pending"
} as const satisfies Record<OutboundCallApprovalStatus, string>;

export const outboundRequestStatusLabels = {
  approved: "Approved",
  blocked: "Blocked",
  cancelled: "Cancelled",
  completed: "Completed",
  draft: "Draft",
  pending_approval: "Pending approval",
  ready_for_provider: "Ready for provider"
} as const satisfies Record<OutboundCallRequestStatus, string>;

export function maskPhoneNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  const lastFour = digits.slice(-4);

  return lastFour ? `***-***-${lastFour}` : "Masked number";
}
