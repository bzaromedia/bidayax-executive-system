import { transitionVoiceRuntimeState } from "./conversation-state-machine";
import { createRuntimeDialogueResponse } from "./dialogue-policy";
import { classifyRuntimeIntent } from "./intent-engine";
import { detectRuntimeLanguage } from "./language-engine";
import { createMockSpeechRecognitionProvider } from "./mock-speech-recognition";
import { createMockSpeechSynthesisProvider } from "./mock-speech-synthesis";
import { planRuntimeTool } from "./tool-planner";
import type {
  SpeechRecognitionProvider,
  SpeechSynthesisProvider,
  VoiceRuntimeAuditEvent,
  VoiceRuntimeInput,
  VoiceRuntimeSession,
  VoiceRuntimeTurn
} from "./types";

function createAuditEvent(input: {
  readonly eventType: string;
  readonly occurredAt: string;
  readonly session: VoiceRuntimeSession;
  readonly metadata: Record<string, string | number | boolean | null>;
}): VoiceRuntimeAuditEvent {
  return {
    cardId: input.session.cardId,
    eventId: `${input.session.sessionId}:${input.eventType}:${input.occurredAt}`,
    eventType: input.eventType,
    metadata: input.metadata,
    occurredAt: input.occurredAt,
    sessionId: input.session.sessionId,
    tenantId: input.session.tenantId
  };
}

export async function processVoiceRuntimeTurn(input: VoiceRuntimeInput & {
  readonly speechRecognitionProvider?: SpeechRecognitionProvider;
  readonly speechSynthesisProvider?: SpeechSynthesisProvider;
}): Promise<VoiceRuntimeTurn> {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const recognizer = input.speechRecognitionProvider ?? createMockSpeechRecognitionProvider();
  const synthesizer = input.speechSynthesisProvider ?? createMockSpeechSynthesisProvider();
  let state = transitionVoiceRuntimeState("idle", "start_session");

  state = input.mode === "text_chat"
    ? transitionVoiceRuntimeState(state, "transcript_received")
    : transitionVoiceRuntimeState(state, "audio_received");

  const recognitionInput = {
    ...(input.audioReference ? { audioReference: input.audioReference } : {}),
    ...(input.preferredLanguage ? { languageHint: input.preferredLanguage } : {}),
    ...(input.text ? { text: input.text } : {})
  };
  const recognition = await recognizer.transcribe(recognitionInput);

  if (state === "transcribing") {
    state = transitionVoiceRuntimeState(state, "transcript_received");
  }

  const language = detectRuntimeLanguage({
    preferredLanguage: input.preferredLanguage ?? recognition.language,
    transcript: recognition.transcript
  });
  const intent = classifyRuntimeIntent(recognition.transcript);
  state = transitionVoiceRuntimeState(state, "intent_classified");

  const toolPlan = planRuntimeTool(intent);

  if (toolPlan.requiresHumanApproval) {
    state = transitionVoiceRuntimeState(state, "escalate");
  } else {
    state = transitionVoiceRuntimeState(state, "tool_planned");
  }

  const response = createRuntimeDialogueResponse({ intent, language, toolPlan });
  const synthesizedAudio = await synthesizer.synthesize({
    language: language.language,
    text: response.text
  });

  if (state === "responding") {
    state = transitionVoiceRuntimeState(state, "complete");
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
    intent,
    language,
    response,
    session,
    synthesizedAudio,
    toolPlan,
    transcript: recognition.transcript
  };
}