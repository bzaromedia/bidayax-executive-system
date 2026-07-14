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
  const conversationSafety = validateConversationSafety({
    ...(input.consent ? { consent: input.consent } : {}),
    ...(input.consentPolicy ? { consentPolicy: input.consentPolicy } : {}),
    mode: input.mode,
    ...(input.redactionPolicy ? { redactionPolicy: input.redactionPolicy } : {}),
    ...(input.retentionPolicy ? { retentionPolicy: input.retentionPolicy } : {}),
    transcript: recognition.transcript
  });
  const safety = conversationSafety.safety;
  const classifiedIntent = classifyRuntimeIntent(recognition.transcript);
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
