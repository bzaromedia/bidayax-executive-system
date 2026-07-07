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

export const callIntents = [
  "sales",
  "investor",
  "customer",
  "partner",
  "vendor",
  "media",
  "legal",
  "emergency",
  "personal",
  "spam",
  "unknown"
] as const;

export type CallIntent = (typeof callIntents)[number];

export const receptionistActions = [
  "book_meeting",
  "take_message",
  "answer_faq",
  "qualify_lead",
  "transfer_call",
  "request_callback",
  "escalate_emergency",
  "block_spam",
  "request_human_approval",
  "queue_internal_request"
] as const;

export type ReceptionistAction = (typeof receptionistActions)[number];

export const receptionistWorkflowNodeTypes = [
  "trigger",
  "language_detection",
  "intent_classifier",
  "trust_score",
  "calendar_lookup",
  "transfer",
  "callback",
  "message_capture",
  "event_ledger_write",
  "contact_graph_update",
  "notification",
  "human_approval",
  "summary"
] as const;

export type ReceptionistWorkflowNodeType =
  (typeof receptionistWorkflowNodeTypes)[number];

export const receptionistProviderStatusValues = [
  "configured",
  "provider_unconfigured",
  "queued",
  "sent",
  "failed",
  "blocked_by_policy",
  "requires_human_review"
] as const;

export type ReceptionistProviderStatusValue =
  (typeof receptionistProviderStatusValues)[number];

export const receptionistInteractionModes = [
  "phone",
  "chat",
  "voice_chat",
  "form"
] as const;

export type ReceptionistInteractionMode =
  (typeof receptionistInteractionModes)[number];

export const receptionistWorkflowTriggerTypes = [
  "inbound_call",
  "chat",
  "voice_chat",
  "form_submit"
] as const;

export type ReceptionistWorkflowTriggerType =
  (typeof receptionistWorkflowTriggerTypes)[number];

export const receptionistFrontOfficeStatuses = [
  "received",
  "processing",
  "scheduled",
  "callback_queued",
  "completed",
  "escalated",
  "blocked"
] as const;

export type ReceptionistFrontOfficeStatus =
  (typeof receptionistFrontOfficeStatuses)[number];

export type ReceptionistInteraction = {
  readonly id: string;
  readonly mode: ReceptionistInteractionMode;
  readonly executiveId: ExecutiveSlug;
  readonly cardId: string;
  readonly visitorId?: string;
  readonly callerPhone?: string;
  readonly language: string;
  readonly dialect?: string;
  readonly intent: string;
  readonly urgencyScore: number;
  readonly trustScore: number;
  readonly action: ReceptionistAction;
  readonly transcript?: string;
  readonly translatedSummary?: string;
  readonly status: ReceptionistFrontOfficeStatus;
  readonly createdAt: string;
};

export type WorkflowNodeRun = {
  readonly nodeId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly status: ReceptionistProviderStatusValue;
  readonly summary: string;
};

export type ReceptionistAuditEvent = {
  readonly eventId: string;
  readonly interactionId: string;
  readonly eventType: string;
  readonly actor: "visitor" | "receptionist" | "system" | "executive";
  readonly timestamp: string;
  readonly payload: Record<string, string | number | boolean | null>;
};

export type CallbackRule = {
  readonly ruleId: string;
  readonly label: string;
  readonly priority: ReceptionistPriority;
  readonly requireHumanApproval: boolean;
};

export type AvailabilityRule = {
  readonly ruleId: string;
  readonly label: string;
  readonly action: "answer_now" | "transfer" | "schedule" | "take_message" | "queue_callback" | "require_approval" | "block";
};

export type CalendarRule = {
  readonly ruleId: string;
  readonly label: string;
  readonly timezone: string;
  readonly enabled: boolean;
};

export type TransferRule = {
  readonly ruleId: string;
  readonly label: string;
  readonly destination: string;
  readonly enabled: boolean;
};

export type BlockRule = {
  readonly ruleId: string;
  readonly label: string;
  readonly pattern: string;
  readonly reason: string;
};

export type ExecutiveReceptionistSettings = {
  readonly languages: readonly ReceptionistLanguage[];
  readonly defaultLanguage: ReceptionistLanguage;
  readonly businessPhone: string;
  readonly callbackRules: readonly CallbackRule[];
  readonly availabilityRules: readonly AvailabilityRule[];
  readonly calendarRules: readonly CalendarRule[];
  readonly transferRules: readonly TransferRule[];
  readonly blockedCallerRules: readonly BlockRule[];
  readonly humanApprovalRequired: boolean;
};

export type AppointmentRequest = {
  readonly appointmentRequestId: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly requesterName: string | null;
  readonly requesterEmail: string | null;
  readonly requesterCompany: string | null;
  readonly preferredTime: string | null;
  readonly purpose: string;
  readonly status: "queued" | "requires_human_review" | "blocked" | "scheduled";
};

export type ConversationMemory = {
  readonly callerName: string | null;
  readonly company: string | null;
  readonly intent: CallIntent | ReceptionistRequestType | "unknown";
  readonly requestedTime: string | null;
  readonly urgency: ReceptionistPriority;
  readonly language: string;
  readonly summary: string;
  readonly actionItems: readonly string[];
  readonly followUpRequired: boolean;
};

export type ReceptionistTask = {
  readonly taskId: string;
  readonly interactionId: string;
  readonly taskType: ReceptionistTaskType | "callback" | "appointment" | "message";
  readonly status: "queued" | "requires_human_review" | "completed" | "blocked";
  readonly dueAt: string | null;
  readonly summary: string;
};

export type CallerProfile = {
  readonly callerId: string;
  readonly name: string | null;
  readonly phone: string;
  readonly email: string | null;
  readonly company: string | null;
  readonly verifiedIdentity: boolean;
  readonly repeatContactCount: number;
  readonly lastContactAt: string | null;
};

export type ExecutiveReceptionistPolicy = {
  readonly executiveSlug: ExecutiveSlug;
  readonly transferEnabled: boolean;
  readonly scheduleEnabled: boolean;
  readonly callbackEnabled: boolean;
  readonly blockedCallerPhones: readonly string[];
  readonly priorityCompanies: readonly string[];
  readonly allowedLanguages: readonly SupportedReceptionistLanguage[];
  readonly requireHumanApprovalFor: readonly CallIntent[];
  readonly businessHoursTimezone: string;
};

export type LanguageProfile = {
  readonly detectedLanguage: SupportedReceptionistLanguage | "Unknown";
  readonly detectedDialect: string | null;
  readonly confidence: number;
  readonly defaulted: boolean;
};

export type VoiceTrustScore = {
  readonly score: number;
  readonly tier: "trusted" | "known" | "unverified" | "risky";
  readonly reasonCodes: readonly string[];
};

export type CallbackRequest = {
  readonly callbackId: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly callerPhone: string;
  readonly callerName: string | null;
  readonly preferredTime: string | null;
  readonly priorityScore: number;
  readonly status: "queued" | "requires_human_review" | "blocked";
};

export type MeetingRequest = {
  readonly meetingRequestId: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly requesterName: string | null;
  readonly requesterEmail: string | null;
  readonly requesterCompany: string | null;
  readonly preferredTime: string | null;
  readonly purpose: string;
  readonly status: "queued" | "requires_human_review" | "blocked";
};

export type CallSummary = {
  readonly originalTranscript: string;
  readonly englishSummary: string;
  readonly actionItems: readonly string[];
  readonly callerIntent: CallIntent;
  readonly confidenceScore: number;
};

export type HumanApprovalRequest = {
  readonly approvalId: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly reasonCodes: readonly string[];
  readonly requestedAction: ReceptionistAction;
  readonly status: "required" | "not_required";
};

export type ReceptionistWorkflowNode = {
  readonly id: string;
  readonly type: ReceptionistWorkflowNodeType;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly retryPolicy?: {
    readonly maxAttempts: number;
    readonly backoffMs: number;
  };
};

export type ReceptionistWorkflowRun = {
  readonly runId: string;
  readonly triggerType?: ReceptionistWorkflowTriggerType;
  readonly nodes?: readonly WorkflowNodeRun[];
  readonly result?: ReceptionistInteraction;
  readonly auditTrail?: readonly ReceptionistAuditEvent[];
  readonly executiveSlug: ExecutiveSlug;
  readonly status: ReceptionistProviderStatusValue;
  readonly steps: readonly ReceptionistWorkflowEventDraft[];
  readonly startedAt: string;
  readonly completedAt: string | null;
};

export type ReceptionistCallEvent = {
  readonly id: string;
  readonly executiveId: ExecutiveSlug;
  readonly callerPhone: string;
  readonly detectedLanguage: SupportedReceptionistLanguage | "Unknown";
  readonly detectedDialect?: string;
  readonly intent: CallIntent;
  readonly urgencyScore: number;
  readonly trustScore: number;
  readonly transcriptOriginal: string;
  readonly transcriptEnglish?: string;
  readonly summary: string;
  readonly actionTaken: ReceptionistAction;
  readonly followUpRequired: boolean;
  readonly createdAt: string;
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


export const receptionistVoiceProfiles = [
  "executive",
  "warm",
  "calm",
  "professional",
  "luxury"
] as const;

export const receptionistMoods = [
  "confident",
  "friendly",
  "concise",
  "formal",
  "calm"
] as const;

export const receptionistGreetingModes = ["standard", "custom"] as const;

export const receptionistFallbackBehaviors = [
  "queue_callback",
  "take_message",
  "route_to_email",
  "human_review"
] as const;

export const receptionistAfterHoursBehaviors = [
  "queue_next_business_day",
  "take_message",
  "urgent_escalation_only",
  "disabled"
] as const;

export const receptionistRecordingPolicies = [
  "disabled",
  "disclose_and_record",
  "transcript_only"
] as const;

export type ReceptionistVoiceProfile = (typeof receptionistVoiceProfiles)[number];
export type ReceptionistMood = (typeof receptionistMoods)[number];
export type ReceptionistGreetingMode = (typeof receptionistGreetingModes)[number];
export type ReceptionistFallbackBehavior = (typeof receptionistFallbackBehaviors)[number];
export type ReceptionistAfterHoursBehavior = (typeof receptionistAfterHoursBehaviors)[number];
export type ReceptionistRecordingPolicy = (typeof receptionistRecordingPolicies)[number];

export type CallRoutingRule = {
  readonly ruleId: string;
  readonly label: string;
  readonly intent: ReceptionistRequestType | "urgent" | "unknown";
  readonly action: "queue_callback" | "take_message" | "route_to_email" | "human_review" | "block";
  readonly priority: ReceptionistPriority;
  readonly enabled: boolean;
};

export type AppointmentRules = {
  readonly enabled: boolean;
  readonly calendarUrl: string | null;
  readonly timezone: string;
  readonly allowedWindows: readonly string[];
  readonly requireHumanApproval: boolean;
};

export type EscalationContact = {
  readonly contactId: string;
  readonly label: string;
  readonly email: string;
  readonly phone: string | null;
  readonly priority: ReceptionistPriority;
};

export type ReceptionistSettings = {
  readonly tenantId: string;
  readonly enabled: boolean;
  readonly defaultLanguage: ReceptionistLanguage;
  readonly supportedLanguages: readonly ReceptionistLanguage[];
  readonly voiceProfile: ReceptionistVoiceProfile;
  readonly mood: ReceptionistMood;
  readonly greetingMode: ReceptionistGreetingMode;
  readonly standardGreeting: string;
  readonly customGreeting: string | null;
  readonly fallbackBehavior: ReceptionistFallbackBehavior;
  readonly callRoutingRules: readonly CallRoutingRule[];
  readonly appointmentRules: AppointmentRules;
  readonly afterHoursBehavior: ReceptionistAfterHoursBehavior;
  readonly escalationContacts: readonly EscalationContact[];
  readonly consentDisclosure: string;
  readonly recordingPolicy: ReceptionistRecordingPolicy;
};