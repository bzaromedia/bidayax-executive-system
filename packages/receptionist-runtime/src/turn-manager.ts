import { evaluateRuntimeConsent } from "./consent-policy";
import { transitionVoiceRuntimeState } from "./conversation-state-machine";
import { validateConversationSafety } from "./conversation-safety-validation";
import { createRuntimeDialogueResponse } from "./dialogue-policy";
import { classifyRuntimeIntent } from "./intent-engine";
import { detectRuntimeLanguage } from "./language-engine";
import { createMockSpeechRecognitionProvider } from "./mock-speech-recognition";
import { createMockSpeechSynthesisProvider } from "./mock-speech-synthesis";
import {
  assertRuntimeScope,
  createVoiceRuntimeReplayKey
} from "./runtime-safety";
import { planRuntimeTool } from "./tool-planner";
import type {
  RuntimeConsentResult,
  RuntimeConsentSensitiveCapability,
  RuntimeIntentClassification,
  RuntimeToolPlan,
  SpeechRecognitionProvider,
  SpeechSynthesisProvider,
  VoiceRuntimeAuditEvent,
  VoiceRuntimeInput,
  VoiceRuntimeReplayStore,
  VoiceRuntimeSession,
  VoiceRuntimeTurn
} from "./types";

function createAuditEvent(input: {
  readonly eventType: string;
  readonly metadata: VoiceRuntimeAuditEvent["metadata"];
  readonly occurredAt: string;
  readonly session: VoiceRuntimeSession;
}): VoiceRuntimeAuditEvent {
  return {
    cardId: input.session.cardId,
    eventId: `${input.eventType}:${input.session.sessionId}:${input.occurredAt}`,
    eventType: input.eventType,
    metadata: input.metadata,
    occurredAt: input.occurredAt,
    sessionId: input.session.sessionId,
    tenantId: input.session.tenantId
  };
}

function uniqueCapabilities(capabilities: readonly RuntimeConsentSensitiveCapability[]): readonly RuntimeConsentSensitiveCapability[] {
  return [...new Set(capabilities)];
}

function derivePreRecognitionCapabilities(input: VoiceRuntimeInput): readonly RuntimeConsentSensitiveCapability[] {
  const capabilities: RuntimeConsentSensitiveCapability[] = [...(input.requestedCapabilities ?? [])];

  if (input.mode === "voice_chat" || input.mode === "phone_simulation") {
    capabilities.push("live_voice", "transcription");
  }

  if (input.audioReference) {
    capabilities.push("transcription");
  }

  if (input.consent?.recordingRequested) {
    capabilities.push("recording");
  }

  return uniqueCapabilities(capabilities);
}

function deriveToolCapabilities(
  baseCapabilities: readonly RuntimeConsentSensitiveCapability[],
  intent: RuntimeIntentClassification,
  toolPlan: RuntimeToolPlan
): readonly RuntimeConsentSensitiveCapability[] {
  const capabilities: RuntimeConsentSensitiveCapability[] = [...baseCapabilities];

  if (toolPlan.requiresHumanApproval || intent.intent === "sensitive_request" || intent.intent === "emergency") {
    capabilities.push("sensitive_tool");
  }

  return uniqueCapabilities(capabilities);
}

async function createConsentBlockedTurn(input: VoiceRuntimeInput & {
  readonly consentResult: RuntimeConsentResult;
  readonly now: Date;
  readonly requestedCapabilities: readonly RuntimeConsentSensitiveCapability[];
  readonly speechSynthesisProvider?: SpeechSynthesisProvider;
}): Promise<VoiceRuntimeTurn> {
  const timestamp = input.now.toISOString();
  const session: VoiceRuntimeSession = {
    cardId: input.cardId,
    language: "English",
    mode: input.mode,
    providerStatus: "blocked_by_policy",
    sessionId: input.sessionId,
    startedAt: timestamp,
    state: "blocked",
    tenantId: input.tenantId,
    turnCount: 1,
    updatedAt: timestamp
  };
  const synthesizer = input.speechSynthesisProvider ?? createMockSpeechSynthesisProvider();
  const response = {
    requiresHumanApproval: false,
    shouldEndSession: true,
    text: "Consent is required before I can continue this voice or recording-related interaction."
  };
  const synthesizedAudio = await synthesizer.synthesize({
    language: "English",
    text: response.text
  });
  const safety = {
    decision: "block" as const,
    reasonCodes: [...input.consentResult.reasonCodes, "CONSENT_POLICY_BLOCK"],
    sanitizedTranscriptPreview: ""
  };
  const conversationSafety = {
    consent: input.consentResult,
    decision: "block" as const,
    reasonCodes: [...input.consentResult.reasonCodes, "PRE_RECOGNITION_CONSENT_BLOCK"],
    redaction: {
      applied: ["NO_TRANSCRIPT_CAPTURED"],
      policy: {
        redactEmails: true,
        redactLinks: true,
        redactPhoneNumbers: true,
        redactSecrets: true,
        transcriptPreviewMaxLength: 240
      },
      redactedText: ""
    },
    retention: {
      allowed: true,
      policy: {
        auditEventRetentionDays: 365,
        rawAudioRetentionAllowed: false,
        recordingRetentionDays: 0,
        transcriptPreviewRetentionDays: 30
      },
      reasonCodes: ["RETENTION_POLICY_NOT_REACHED"]
    },
    safety
  };
  const intent = {
    confidence: 0.99,
    intent: "prompt_injection" as const,
    reasonCodes: safety.reasonCodes
  };
  const toolPlan = {
    providerStatus: "blocked_by_policy" as const,
    reasonCodes: ["CONSENT_POLICY_BLOCK"],
    requiresHumanApproval: false,
    toolName: "safe_fallback" as const
  };

  return {
    auditEvents: [
      createAuditEvent({
        eventType: "voice_runtime.turn.blocked_before_recognition",
        metadata: {
          capabilityCount: input.requestedCapabilities.length,
          consentStatus: input.consentResult.status,
          reasonCount: input.consentResult.reasonCodes.length
        },
        occurredAt: timestamp,
        session
      }),
      createAuditEvent({
        eventType: "voice_runtime.safety.assessed",
        metadata: {
          consentStatus: input.consentResult.status,
          decision: "block",
          reasonCount: conversationSafety.reasonCodes.length,
          redactionApplied: "NO_TRANSCRIPT_CAPTURED",
          retentionDays: 0,
          transcriptPreview: ""
        },
        occurredAt: timestamp,
        session
      })
    ],
    conversationSafety,
    intent,
    language: {
      confidence: 1,
      dialect: null,
      fallbackUsed: true,
      language: "English"
    },
    response,
    safety,
    session,
    synthesizedAudio,
    toolPlan,
    transcript: ""
  };
}

export async function processVoiceRuntimeTurn(input: VoiceRuntimeInput & {
  readonly replayStore?: VoiceRuntimeReplayStore;
  readonly speechRecognitionProvider?: SpeechRecognitionProvider;
  readonly speechSynthesisProvider?: SpeechSynthesisProvider;
}): Promise<VoiceRuntimeTurn> {
  assertRuntimeScope(input);

  const replayKey = input.replayKey ?? createVoiceRuntimeReplayKey(input);
  if (input.replayStore?.has(replayKey)) {
    throw new Error("Voice runtime replay detected.");
  }
  input.replayStore?.remember(replayKey);

  const now = input.now ?? new Date();
  const preRecognitionCapabilities = derivePreRecognitionCapabilities(input);
  const preRecognitionConsent = evaluateRuntimeConsent({
    ...(input.consent ? { consent: input.consent } : {}),
    mode: input.mode,
    ...(input.consentPolicy ? { policy: input.consentPolicy } : {}),
    requestedCapabilities: preRecognitionCapabilities
  });

  if (!preRecognitionConsent.allowed) {
    return createConsentBlockedTurn({
      ...input,
      consentResult: preRecognitionConsent,
      now,
      requestedCapabilities: preRecognitionCapabilities
    });
  }

  const timestamp = now.toISOString();
  const recognizer = input.speechRecognitionProvider ?? createMockSpeechRecognitionProvider();
  const synthesizer = input.speechSynthesisProvider ?? createMockSpeechSynthesisProvider();
  let state = transitionVoiceRuntimeState("initialized", "request_received");
  state = transitionVoiceRuntimeState(state, "greeting_ready");
  state = transitionVoiceRuntimeState(state, "transcript_ready");

  const recognitionInput = {
    ...(input.audioReference ? { audioReference: input.audioReference } : {}),
    ...(input.preferredLanguage ? { languageHint: input.preferredLanguage } : {}),
    ...(input.text ? { text: input.text } : {})
  };
  const recognition = await recognizer.transcribe(recognitionInput);
  const language = detectRuntimeLanguage({
    preferredLanguage: input.preferredLanguage ?? recognition.language,
    transcript: recognition.transcript
  });
  const classifiedIntent = classifyRuntimeIntent(recognition.transcript);
  const initialSafety = validateConversationSafety({
    ...(input.consent ? { consent: input.consent } : {}),
    ...(input.consentPolicy ? { consentPolicy: input.consentPolicy } : {}),
    mode: input.mode,
    ...(input.redactionPolicy ? { redactionPolicy: input.redactionPolicy } : {}),
    ...(input.retentionPolicy ? { retentionPolicy: input.retentionPolicy } : {}),
    requestedCapabilities: preRecognitionCapabilities,
    transcript: recognition.transcript
  });
  const initialIntent = initialSafety.safety.decision === "block"
    ? {
      confidence: 0.99,
      intent: "prompt_injection" as const,
      reasonCodes: initialSafety.safety.reasonCodes
    }
    : initialSafety.safety.decision === "escalate"
      ? {
        confidence: 0.99,
        intent: "emergency" as const,
        reasonCodes: initialSafety.safety.reasonCodes
      }
      : classifiedIntent;
  const initialToolPlan = planRuntimeTool(initialIntent);
  const toolCapabilities = deriveToolCapabilities(preRecognitionCapabilities, initialIntent, initialToolPlan);
  const conversationSafety = validateConversationSafety({
    ...(input.consent ? { consent: input.consent } : {}),
    ...(input.consentPolicy ? { consentPolicy: input.consentPolicy } : {}),
    mode: input.mode,
    ...(input.redactionPolicy ? { redactionPolicy: input.redactionPolicy } : {}),
    ...(input.retentionPolicy ? { retentionPolicy: input.retentionPolicy } : {}),
    requestedCapabilities: toolCapabilities,
    transcript: recognition.transcript
  });
  const safety = conversationSafety.safety;
  const intent = safety.decision === "block"
    ? {
      confidence: 0.99,
      intent: "prompt_injection" as const,
      reasonCodes: safety.reasonCodes
    }
    : safety.decision === "escalate"
      ? {
        confidence: 0.99,
        intent: "emergency" as const,
        reasonCodes: safety.reasonCodes
      }
      : classifiedIntent;
  const toolPlan = planRuntimeTool(intent);

  if (toolPlan.providerStatus === "blocked_by_policy") {
    state = transitionVoiceRuntimeState(state, "block");
  } else if (toolPlan.requiresHumanApproval) {
    state = transitionVoiceRuntimeState(state, "safety_review_required");
  } else {
    state = transitionVoiceRuntimeState(state, "tool_required");
    state = transitionVoiceRuntimeState(state, "tool_complete");
  }

  const response = createRuntimeDialogueResponse({ intent, language, toolPlan });
  const synthesizedAudio = await synthesizer.synthesize({
    language: language.language,
    text: response.text
  });

  if (state === "responding") {
    state = transitionVoiceRuntimeState(state, "response_sent");
  }

  const session: VoiceRuntimeSession = {
    cardId: input.cardId,
    language: language.language,
    mode: input.mode,
    providerStatus: toolPlan.providerStatus,
    sessionId: input.sessionId,
    startedAt: timestamp,
    state,
    tenantId: input.tenantId,
    turnCount: 1,
    updatedAt: timestamp
  };

  return {
    auditEvents: [
      createAuditEvent({
        eventType: "voice_runtime.turn.received",
        metadata: { mode: input.mode, providerStatus: recognition.providerStatus },
        occurredAt: timestamp,
        session
      }),
      createAuditEvent({
        eventType: "voice_runtime.safety.assessed",
        metadata: {
          consentStatus: conversationSafety.consent.status,
          decision: safety.decision,
          reasonCount: conversationSafety.reasonCodes.length,
          redactionApplied: conversationSafety.redaction.applied.join(","),
          retentionDays: conversationSafety.retention.policy.transcriptPreviewRetentionDays,
          transcriptPreview: safety.sanitizedTranscriptPreview
        },
        occurredAt: timestamp,
        session
      }),
      createAuditEvent({
        eventType: "voice_runtime.intent.classified",
        metadata: { confidence: intent.confidence, intent: intent.intent },
        occurredAt: timestamp,
        session
      }),
      createAuditEvent({
        eventType: "voice_runtime.tool.planned",
        metadata: {
          providerStatus: toolPlan.providerStatus,
          requiresHumanApproval: toolPlan.requiresHumanApproval,
          toolName: toolPlan.toolName
        },
        occurredAt: timestamp,
        session
      })
    ],
    conversationSafety,
    intent,
    language,
    response,
    safety,
    session,
    synthesizedAudio,
    toolPlan,
    transcript: recognition.transcript
  };
}
