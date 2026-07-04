import type { ExecutiveSlug } from "./events";

export const receptionistInteractionTypes = [
  "inbound_call",
  "outbound_call",
  "email",
  "scheduling_request",
  "website_inquiry",
  "follow_up",
  "internal_note"
] as const;

export type ReceptionistInteractionType =
  (typeof receptionistInteractionTypes)[number];

export const receptionistChannels = [
  "phone",
  "email",
  "web",
  "sms",
  "internal"
] as const;

export type ReceptionistChannel = (typeof receptionistChannels)[number];

export const receptionistInteractionStatuses = [
  "simulated",
  "received",
  "classified",
  "pending_review",
  "escalated",
  "resolved",
  "archived"
] as const;

export type ReceptionistInteractionStatus =
  (typeof receptionistInteractionStatuses)[number];

export const receptionistTaskTypes = [
  "return_call",
  "send_email",
  "schedule_meeting",
  "qualify_lead",
  "escalate_to_executive",
  "update_contact_graph",
  "create_follow_up",
  "review_transcript"
] as const;

export type ReceptionistTaskType = (typeof receptionistTaskTypes)[number];

export const receptionistTaskStatuses = [
  "simulated",
  "pending",
  "in_review",
  "approved",
  "completed",
  "cancelled"
] as const;

export type ReceptionistTaskStatus = (typeof receptionistTaskStatuses)[number];

export const receptionistSpeakers = [
  "visitor",
  "receptionist",
  "system",
  "executive"
] as const;

export type ReceptionistSpeaker = (typeof receptionistSpeakers)[number];

export const receptionistWorkflowEventTypes = [
  "interaction_created",
  "language_detected",
  "intent_classified",
  "task_created",
  "escalation_recommended",
  "summary_generated",
  "workflow_completed"
] as const;

export type ReceptionistWorkflowEventType =
  (typeof receptionistWorkflowEventTypes)[number];

export const receptionistIntentCategories = [
  "general_inquiry",
  "route_message",
  "schedule_meeting",
  "request_callback",
  "qualify_lead",
  "partnership_request",
  "partnership_interest",
  "investor_interest",
  "vendor_inquiry",
  "support_request",
  "wrong_number",
  "spam_or_low_value",
  "urgent_executive_attention",
  "unknown"
] as const;

export type ReceptionistIntentCategory =
  (typeof receptionistIntentCategories)[number];

export const receptionistSentiments = [
  "positive",
  "neutral",
  "negative",
  "unknown"
] as const;

export type ReceptionistSentiment = (typeof receptionistSentiments)[number];

export const receptionistPriorities = [
  "low",
  "medium",
  "high",
  "urgent"
] as const;

export type ReceptionistPriority = (typeof receptionistPriorities)[number];

export const supportedReceptionistLanguages = [
  "English",
  "Arabic",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Hindi",
  "Urdu",
  "Mandarin",
  "Cantonese",
  "Japanese",
  "Korean",
  "Russian"
] as const;

export type SupportedReceptionistLanguage =
  (typeof supportedReceptionistLanguages)[number];

export type ReceptionistLanguageProfile = {
  readonly language: SupportedReceptionistLanguage | "Unknown";
  readonly dialect: string | null;
  readonly confidence: number;
  readonly script: string;
  readonly direction: "ltr" | "rtl" | "unknown";
  readonly notes: string;
};

export type ReceptionistEscalationRecommendation = {
  readonly shouldEscalate: boolean;
  readonly reasonCodes: readonly string[];
  readonly recommendation: string;
};

export type ReceptionistTaskDraft = {
  readonly taskType: ReceptionistTaskType;
  readonly status: ReceptionistTaskStatus;
  readonly assignedTo: string | null;
  readonly dueAt: string | null;
  readonly priority: ReceptionistPriority;
  readonly description: string;
};

export type ReceptionistConversationTurnDraft = {
  readonly speaker: ReceptionistSpeaker;
  readonly language: SupportedReceptionistLanguage | "Unknown";
  readonly text: string;
  readonly sequenceNumber: number;
};

export type ReceptionistWorkflowEventDraft = {
  readonly eventType: ReceptionistWorkflowEventType;
  readonly payload: Record<string, string | number | boolean | null>;
};

export type SimulateReceptionistInteractionInput = {
  readonly interactionType: ReceptionistInteractionType;
  readonly channel: ReceptionistChannel;
  readonly text: string;
  readonly language: SupportedReceptionistLanguage | "Unknown";
  readonly dialect?: string | null;
  readonly executiveSlug: ExecutiveSlug;
  readonly callerOrSender?: string | null;
  readonly anonymousVisitorId?: string | null;
  readonly sessionId?: string | null;
};

export type SimulateReceptionistInteractionResult = {
  readonly interactionType: ReceptionistInteractionType;
  readonly channel: ReceptionistChannel;
  readonly status: "simulated";
  readonly executiveSlug: ExecutiveSlug;
  readonly languageProfile: ReceptionistLanguageProfile;
  readonly classifiedIntent: ReceptionistIntentCategory;
  readonly sentiment: ReceptionistSentiment;
  readonly priority: ReceptionistPriority;
  readonly tasks: readonly ReceptionistTaskDraft[];
  readonly escalation: ReceptionistEscalationRecommendation;
  readonly summary: string;
  readonly conversationTurns: readonly ReceptionistConversationTurnDraft[];
  readonly workflowEvents: readonly ReceptionistWorkflowEventDraft[];
};

export const receptionistRequestTypes = [
  "schedule_meeting",
  "route_message",
  "request_callback",
  "qualify_lead",
  "general_inquiry",
  "partnership_request",
  "support_request"
] as const;

export type ReceptionistRequestType =
  (typeof receptionistRequestTypes)[number];

export const receptionistLanguages = [
  "English",
  "Spanish",
  "Arabic",
  "French",
  "Mandarin",
  "Urdu",
  "Hindi"
] as const;

export type ReceptionistLanguage = (typeof receptionistLanguages)[number];

export const receptionistRequestStatuses = [
  "configured",
  "queued",
  "sent",
  "failed",
  "blocked_by_policy",
  "requires_human_review",
  "email_ready",
  "provider_unconfigured",
  "event_store_unavailable",
  "invalid"
] as const;

export type ReceptionistStatus = (typeof receptionistRequestStatuses)[number];

export type ReceptionistRequest = {
  readonly executiveSlug: ExecutiveSlug;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly company?: string;
  readonly preferredLanguage: ReceptionistLanguage;
  readonly dialect?: string;
  readonly requestType: ReceptionistRequestType;
  readonly message: string;
  readonly preferredTime?: string;
  readonly consent: true;
};

export type ReceptionistNotificationPayload = {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
  readonly request: ReceptionistRequest;
};

export function isReceptionistInteractionType(
  value: string
): value is ReceptionistInteractionType {
  return (receptionistInteractionTypes as readonly string[]).includes(value);
}

export function isReceptionistChannel(
  value: string
): value is ReceptionistChannel {
  return (receptionistChannels as readonly string[]).includes(value);
}

export function isReceptionistIntentCategory(
  value: string
): value is ReceptionistIntentCategory {
  return (receptionistIntentCategories as readonly string[]).includes(value);
}

export function isReceptionistPriority(
  value: string
): value is ReceptionistPriority {
  return (receptionistPriorities as readonly string[]).includes(value);
}

export function isReceptionistRequestType(
  value: string
): value is ReceptionistRequestType {
  return (receptionistRequestTypes as readonly string[]).includes(value);
}

export function isReceptionistLanguage(
  value: string
): value is ReceptionistLanguage {
  return (receptionistLanguages as readonly string[]).includes(value);
}

