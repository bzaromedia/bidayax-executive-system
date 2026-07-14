import { createHash } from "node:crypto";
import type { RuntimeSafetyAssessment, VoiceRuntimeInput, VoiceRuntimeReplayStore } from "./types";

const promptInjectionPatterns = [
  /ignore (all )?(previous|system|developer) instructions/iu,
  /reveal (your )?(system prompt|developer message|internal instructions)/iu,
  /bypass (policy|safety|guardrails)/iu,
  /act as (an )?unrestricted/iu,
  /forget (the )?rules/iu
];

const emergencyPatterns = [
  /\b(emergency|life threatening|suicide|self harm|heart attack|stroke|fire|violence|weapon)\b/iu,
  /\b(call 911|urgent danger|immediate danger)\b/iu
];

const secretPatterns = [
  /api[_-]?key\s*[:=]\s*\S+/giu,
  /authorization:\s*bearer\s+\S+/giu,
  /cookie:\s*\S+/giu
];

export function sanitizeRuntimeTranscriptPreview(transcript: string): string {
  const withoutSecrets = secretPatterns.reduce(
    (value, pattern) => value.replace(pattern, "[REDACTED_SECRET]"),
    transcript
  );

  return withoutSecrets
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[REDACTED_EMAIL]")
    .replace(/\+?\d[\d\s().-]{7,}\d/gu, "[REDACTED_PHONE]")
    .slice(0, 240);
}

export function assessRuntimeSafety(transcript: string): RuntimeSafetyAssessment {
  const sanitizedTranscriptPreview = sanitizeRuntimeTranscriptPreview(transcript);
  const reasonCodes: string[] = [];

  if (promptInjectionPatterns.some((pattern) => pattern.test(transcript))) {
    reasonCodes.push("PROMPT_INJECTION_ATTEMPT");
  }

  if (emergencyPatterns.some((pattern) => pattern.test(transcript))) {
    reasonCodes.push("EMERGENCY_LANGUAGE_DETECTED");
  }

  if (reasonCodes.includes("PROMPT_INJECTION_ATTEMPT")) {
    return {
      decision: "block",
      reasonCodes,
      sanitizedTranscriptPreview
    };
  }

  if (reasonCodes.includes("EMERGENCY_LANGUAGE_DETECTED")) {
    return {
      decision: "escalate",
      reasonCodes,
      sanitizedTranscriptPreview
    };
  }

  return {
    decision: "allow",
    reasonCodes: ["RUNTIME_SAFETY_ALLOWED"],
    sanitizedTranscriptPreview
  };
}

export function createVoiceRuntimeReplayKey(input: VoiceRuntimeInput): string {
  const payload = JSON.stringify({
    audioReference: input.audioReference ?? null,
    cardId: input.cardId,
    mode: input.mode,
    sessionId: input.sessionId,
    tenantId: input.tenantId,
    text: input.text ?? null
  });

  return createHash("sha256").update(payload).digest("hex");
}

export function createInMemoryVoiceRuntimeReplayStore(): VoiceRuntimeReplayStore {
  const values = new Set<string>();

  return {
    has: (replayKey) => values.has(replayKey),
    remember: (replayKey) => {
      values.add(replayKey);
    }
  };
}

export function assertRuntimeScope(input: VoiceRuntimeInput): void {
  if (!input.tenantId.trim() || !input.cardId.trim() || !input.sessionId.trim()) {
    throw new Error("Voice runtime requires tenantId, cardId, and sessionId.");
  }
}