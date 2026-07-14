import type { VoiceRuntimeEvent, VoiceRuntimeState } from "./types";

const transitions: Record<VoiceRuntimeState, readonly VoiceRuntimeState[]> = {
  blocked: [],
  completed: [],
  escalated: [],
  failed: [],
  idle: ["listening", "failed"],
  listening: ["transcribing", "understanding", "blocked", "failed"],
  planning: ["responding", "escalated", "blocked", "failed"],
  responding: ["completed", "listening", "failed"],
  transcribing: ["understanding", "blocked", "failed"],
  understanding: ["planning", "escalated", "blocked", "failed"]
};

const eventTargets: Record<VoiceRuntimeEvent, VoiceRuntimeState> = {
  audio_received: "transcribing",
  block: "blocked",
  complete: "completed",
  escalate: "escalated",
  fail: "failed",
  intent_classified: "planning",
  response_synthesized: "responding",
  start_session: "listening",
  tool_planned: "responding",
  transcript_received: "understanding"
};

export function canTransitionVoiceRuntime(
  from: VoiceRuntimeState,
  to: VoiceRuntimeState
): boolean {
  return transitions[from].includes(to);
}

export function transitionVoiceRuntimeState(
  current: VoiceRuntimeState,
  event: VoiceRuntimeEvent
): VoiceRuntimeState {
  const next = eventTargets[event];

  if (!canTransitionVoiceRuntime(current, next)) {
    throw new Error(`Invalid voice runtime transition from ${current} to ${next}`);
  }

  return next;
}

export function runVoiceRuntimeTransitionPath(
  initial: VoiceRuntimeState,
  events: readonly VoiceRuntimeEvent[]
): VoiceRuntimeState {
  return events.reduce((state, event) => transitionVoiceRuntimeState(state, event), initial);
}