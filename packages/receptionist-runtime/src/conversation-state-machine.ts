import type { ConversationSessionEvent, ConversationSessionState } from "./types";

const transitions: Record<ConversationSessionState, readonly ConversationSessionState[]> = {
  blocked: [],
  completed: [],
  escalating: ["completed", "failed"],
  failed: [],
  greeting: ["listening", "blocked", "failed"],
  initialized: ["greeting", "failed"],
  listening: ["processing", "blocked", "failed"],
  processing: ["waiting_for_tool", "responding", "escalating", "blocked", "failed"],
  responding: ["completed", "listening", "failed"],
  waiting_for_tool: ["responding", "escalating", "blocked", "failed"]
};

const eventTargets: Record<ConversationSessionEvent, ConversationSessionState> = {
  block: "blocked",
  complete: "completed",
  escalate: "escalating",
  fail: "failed",
  greeting_ready: "listening",
  request_received: "greeting",
  response_ready: "responding",
  response_sent: "completed",
  safety_review_required: "escalating",
  tool_complete: "responding",
  tool_required: "waiting_for_tool",
  transcript_ready: "processing"
};

export function canTransitionVoiceRuntime(
  from: ConversationSessionState,
  to: ConversationSessionState
): boolean {
  return transitions[from].includes(to);
}

export function transitionVoiceRuntimeState(
  current: ConversationSessionState,
  event: ConversationSessionEvent
): ConversationSessionState {
  const next = eventTargets[event];

  if (!canTransitionVoiceRuntime(current, next)) {
    throw new Error(`Invalid voice runtime transition from ${current} to ${next}`);
  }

  return next;
}

export function runVoiceRuntimeTransitionPath(
  initial: ConversationSessionState,
  events: readonly ConversationSessionEvent[]
): ConversationSessionState {
  return events.reduce((state, event) => transitionVoiceRuntimeState(state, event), initial);
}