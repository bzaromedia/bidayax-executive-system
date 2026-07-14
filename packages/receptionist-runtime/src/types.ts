export const voiceRuntimeStates = [
  "idle",
  "listening",
  "transcribing",
  "understanding",
  "planning",
  "responding",
  "completed",
  "escalated",
  "blocked",
  "failed"
] as const;

export type VoiceRuntimeState = (typeof voiceRuntimeStates)[number];

export const voiceRuntimeEvents = [
  "start_session",
  "audio_received",
  "transcript_received",
  "intent_classified",
  "tool_planned",
  "response_synthesized",
  "complete",
  "escalate",
  "block",
  "fail"
] as const;

export type VoiceRuntimeEvent = (typeof voiceRuntimeEvents)[number];

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
  readonly state: VoiceRuntimeState;
  readonly providerStatus: VoiceRuntimeProviderStatus;
  readonly language: string;
  readonly turnCount: number;
  readonly startedAt: string;
  readonly updatedAt: string;
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
  readonly toolPlan: RuntimeToolPlan;
  readonly response: RuntimeDialogueResponse;
  readonly synthesizedAudio: SpeechSynthesisResult;
  readonly auditEvents: readonly VoiceRuntimeAuditEvent[];
};