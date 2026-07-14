export const conversationSessionStates = [
  "initialized",
  "greeting",
  "listening",
  "processing",
  "waiting_for_tool",
  "responding",
  "escalating",
  "completed",
  "blocked",
  "failed"
] as const;

export type ConversationSessionState = (typeof conversationSessionStates)[number];
export type VoiceRuntimeState = ConversationSessionState;

export const conversationSessionEvents = [
  "request_received",
  "greeting_ready",
  "transcript_ready",
  "tool_required",
  "tool_complete",
  "response_ready",
  "response_sent",
  "safety_review_required",
  "escalate",
  "block",
  "complete",
  "fail"
] as const;

export type ConversationSessionEvent = (typeof conversationSessionEvents)[number];
export type VoiceRuntimeEvent = ConversationSessionEvent;

export type VoiceRuntimeMode = "text_chat" | "voice_chat" | "phone_simulation";

export type VoiceRuntimeProviderStatus =
  | "mock_only"
  | "provider_unconfigured"
  | "blocked_by_policy"
  | "requires_human_review";

export type VoiceRuntimeSession = {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly mode: VoiceRuntimeMode;
  readonly state: ConversationSessionState;
  readonly providerStatus: VoiceRuntimeProviderStatus;
  readonly language: string;
  readonly turnCount: number;
  readonly startedAt: string;
  readonly updatedAt: string;
};

export type RuntimeConsentInput = {
  readonly automationDisclosureAccepted?: boolean;
  readonly consentDenied?: boolean;
  readonly recordingConsentGranted?: boolean;
  readonly recordingRequested?: boolean;
  readonly transcriptRetentionAccepted?: boolean;
};

export type RuntimeConsentPolicy = {
  readonly automationDisclosureRequired: boolean;
  readonly recordingConsentRequired: boolean;
  readonly transcriptRetentionNoticeRequired: boolean;
};

export type RuntimeConsentResult = {
  readonly allowed: boolean;
  readonly reasonCodes: readonly string[];
  readonly status: "not_required" | "granted" | "missing" | "denied";
};

export type RuntimeRedactionPolicy = {
  readonly redactEmails: boolean;
  readonly redactLinks: boolean;
  readonly redactPhoneNumbers: boolean;
  readonly redactSecrets: boolean;
  readonly transcriptPreviewMaxLength: number;
};

export type RuntimeRedactionResult = {
  readonly applied: readonly string[];
  readonly policy: RuntimeRedactionPolicy;
  readonly redactedText: string;
};

export type RuntimeRetentionPolicy = {
  readonly auditEventRetentionDays: number;
  readonly rawAudioRetentionAllowed: boolean;
  readonly recordingRetentionDays: number;
  readonly transcriptPreviewRetentionDays: number;
};

export type RuntimeRetentionResolution = {
  readonly allowed: boolean;
  readonly policy: RuntimeRetentionPolicy;
  readonly reasonCodes: readonly string[];
};

export type VoiceRuntimeInput = {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly mode: VoiceRuntimeMode;
  readonly text?: string;
  readonly audioReference?: string;
  readonly preferredLanguage?: string;
  readonly now?: Date;
  readonly replayKey?: string;
  readonly consent?: RuntimeConsentInput;
  readonly consentPolicy?: RuntimeConsentPolicy;
  readonly redactionPolicy?: RuntimeRedactionPolicy;
  readonly retentionPolicy?: RuntimeRetentionPolicy;
};

export type SpeechRecognitionInput = {
  readonly audioReference?: string;
  readonly text?: string;
  readonly languageHint?: string;
};

export type SpeechRecognitionResult = {
  readonly transcript: string;
  readonly language: string;
  readonly confidence: number;
  readonly providerStatus: VoiceRuntimeProviderStatus;
};

export type SpeechSynthesisInput = {
  readonly text: string;
  readonly language: string;
  readonly voiceProfileId?: string;
};

export type SpeechSynthesisResult = {
  readonly audioReference: string;
  readonly durationMs: number;
  readonly providerStatus: VoiceRuntimeProviderStatus;
};

export type SpeechRecognitionProvider = {
  readonly providerName: string;
  readonly transcribe: (input: SpeechRecognitionInput) => Promise<SpeechRecognitionResult>;
};

export type SpeechSynthesisProvider = {
  readonly providerName: string;
  readonly synthesize: (input: SpeechSynthesisInput) => Promise<SpeechSynthesisResult>;
};

export type RuntimeLanguageProfile = {
  readonly language: string;
  readonly dialect: string | null;
  readonly confidence: number;
  readonly fallbackUsed: boolean;
};

export type RuntimeIntent =
  | "schedule_meeting"
  | "request_callback"
  | "route_message"
  | "qualify_lead"
  | "support_request"
  | "partnership_request"
  | "general_inquiry"
  | "sensitive_request"
  | "emergency"
  | "prompt_injection"
  | "unknown";

export type RuntimeIntentClassification = {
  readonly intent: RuntimeIntent;
  readonly confidence: number;
  readonly reasonCodes: readonly string[];
};

export type RuntimeToolPlan = {
  readonly toolName:
    | "appointment_request"
    | "callback_request"
    | "message_capture"
    | "lead_qualification"
    | "support_intake"
    | "human_approval"
    | "emergency_escalation"
    | "safe_fallback";
  readonly requiresHumanApproval: boolean;
  readonly providerStatus: VoiceRuntimeProviderStatus;
  readonly reasonCodes: readonly string[];
};

export type RuntimeDialogueResponse = {
  readonly text: string;
  readonly shouldEndSession: boolean;
  readonly requiresHumanApproval: boolean;
};

export type RuntimeSafetyAssessment = {
  readonly decision: "allow" | "escalate" | "block";
  readonly reasonCodes: readonly string[];
  readonly sanitizedTranscriptPreview: string;
};

export type ConversationSafetyValidationInput = {
  readonly consent?: RuntimeConsentInput;
  readonly consentPolicy?: RuntimeConsentPolicy;
  readonly mode: VoiceRuntimeMode;
  readonly redactionPolicy?: RuntimeRedactionPolicy;
  readonly retentionPolicy?: RuntimeRetentionPolicy;
  readonly transcript: string;
};

export type ConversationSafetyValidationResult = {
  readonly consent: RuntimeConsentResult;
  readonly decision: "allow" | "escalate" | "block";
  readonly reasonCodes: readonly string[];
  readonly redaction: RuntimeRedactionResult;
  readonly retention: RuntimeRetentionResolution;
  readonly safety: RuntimeSafetyAssessment;
};

export type VoiceRuntimeAuditEvent = {
  readonly eventId: string;
  readonly eventType: string;
  readonly tenantId: string;
  readonly cardId: string;
  readonly sessionId: string;
  readonly occurredAt: string;
  readonly metadata: Record<string, string | number | boolean | null>;
};

export type VoiceRuntimeTurn = {
  readonly session: VoiceRuntimeSession;
  readonly transcript: string;
  readonly language: RuntimeLanguageProfile;
  readonly intent: RuntimeIntentClassification;
  readonly conversationSafety: ConversationSafetyValidationResult;
  readonly safety: RuntimeSafetyAssessment;
  readonly toolPlan: RuntimeToolPlan;
  readonly response: RuntimeDialogueResponse;
  readonly synthesizedAudio: SpeechSynthesisResult;
  readonly auditEvents: readonly VoiceRuntimeAuditEvent[];
};

export type VoiceRuntimeReplayStore = {
  readonly has: (replayKey: string) => boolean;
  readonly remember: (replayKey: string) => void;
};
