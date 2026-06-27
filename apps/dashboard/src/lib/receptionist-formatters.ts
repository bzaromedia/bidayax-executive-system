import type {
  ReceptionistChannel,
  ReceptionistIntentCategory,
  ReceptionistInteractionType,
  ReceptionistPriority,
  ReceptionistTaskType
} from "@bidayax/types";

export const receptionistInteractionTypeLabels = {
  email: "Email",
  follow_up: "Follow-up",
  inbound_call: "Inbound call",
  internal_note: "Internal note",
  outbound_call: "Outbound call",
  scheduling_request: "Scheduling request",
  website_inquiry: "Website inquiry"
} as const satisfies Record<ReceptionistInteractionType, string>;

export const receptionistChannelLabels = {
  email: "Email",
  internal: "Internal",
  phone: "Phone",
  sms: "SMS",
  web: "Web"
} as const satisfies Record<ReceptionistChannel, string>;

export const receptionistTaskTypeLabels = {
  create_follow_up: "Create follow-up",
  escalate_to_executive: "Escalate to executive",
  qualify_lead: "Qualify signal",
  return_call: "Return call",
  review_transcript: "Review transcript",
  schedule_meeting: "Schedule meeting",
  send_email: "Send email",
  update_contact_graph: "Update contact graph"
} as const satisfies Record<ReceptionistTaskType, string>;

export const receptionistIntentLabels = {
  general_inquiry: "General inquiry",
  investor_interest: "Investor interest",
  partnership_interest: "Partnership interest",
  request_callback: "Request callback",
  schedule_meeting: "Schedule meeting",
  spam_or_low_value: "Spam or low value",
  support_request: "Support request",
  unknown: "Unknown",
  urgent_executive_attention: "Urgent executive attention",
  vendor_inquiry: "Vendor inquiry",
  wrong_number: "Wrong number"
} as const satisfies Record<ReceptionistIntentCategory, string>;

export const receptionistPriorityLabels = {
  high: "High",
  low: "Low",
  medium: "Medium",
  urgent: "Urgent"
} as const satisfies Record<ReceptionistPriority, string>;
