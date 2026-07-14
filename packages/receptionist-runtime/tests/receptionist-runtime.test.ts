import { describe, expect, it } from "vitest";
import {
  canTransitionVoiceRuntime,
  classifyRuntimeIntent,
  createMockSpeechRecognitionProvider,
  createMockSpeechSynthesisProvider,
  detectRuntimeLanguage,
  planRuntimeTool,
  processVoiceRuntimeTurn,
  runVoiceRuntime,
  transitionVoiceRuntimeState
} from "../src";

describe("voice runtime state machine", () => {
  it("allows deterministic happy-path transitions", () => {
    expect(transitionVoiceRuntimeState("idle", "start_session")).toBe("listening");
    expect(canTransitionVoiceRuntime("listening", "transcribing")).toBe(true);
    expect(canTransitionVoiceRuntime("completed", "listening")).toBe(false);
  });

  it("rejects impossible transitions", () => {
    expect(() => transitionVoiceRuntimeState("idle", "complete")).toThrow("Invalid voice runtime transition");
  });
});

describe("mock STT and TTS", () => {
  it("transcribes text input without a live provider", async () => {
    const stt = createMockSpeechRecognitionProvider();

    await expect(stt.transcribe({ text: "schedule a meeting" })).resolves.toMatchObject({
      providerStatus: "mock_only",
      transcript: "schedule a meeting"
    });
  });

  it("synthesizes deterministic mock audio references", async () => {
    const tts = createMockSpeechSynthesisProvider();
    const first = await tts.synthesize({ language: "English", text: "hello" });
    const second = await tts.synthesize({ language: "English", text: "hello" });

    expect(first.audioReference).toBe(second.audioReference);
    expect(first.providerStatus).toBe("mock_only");
  });
});

describe("language, intent, and tool planning", () => {
  it("detects language or safely falls back", () => {
    expect(detectRuntimeLanguage({ transcript: "hola gracias" }).language).toBe("Spanish");
    expect(detectRuntimeLanguage({ transcript: "plain text" }).fallbackUsed).toBe(true);
  });

  it("classifies and plans safe tools", () => {
    const meeting = classifyRuntimeIntent("I want to schedule a meeting");
    const sensitive = classifyRuntimeIntent("Can you approve this contract and payment?");

    expect(planRuntimeTool(meeting).toolName).toBe("appointment_request");
    expect(planRuntimeTool(sensitive)).toMatchObject({
      requiresHumanApproval: true,
      toolName: "human_approval"
    });
  });
});

describe("voice runtime orchestration", () => {
  it("runs a provider-neutral text turn end-to-end", async () => {
    const result = await processVoiceRuntimeTurn({
      cardId: "card-1",
      mode: "text_chat",
      sessionId: "session-1",
      tenantId: "tenant-1",
      text: "Please schedule a meeting next week.",
      now: new Date("2026-07-14T00:00:00.000Z")
    });

    expect(result.session.state).toBe("completed");
    expect(result.intent.intent).toBe("schedule_meeting");
    expect(result.toolPlan.toolName).toBe("appointment_request");
    expect(result.synthesizedAudio.providerStatus).toBe("mock_only");
    expect(result.auditEvents).toHaveLength(3);
  });

  it("escalates sensitive voice turns without provider claims", async () => {
    const result = await runVoiceRuntime({
      cardId: "card-1",
      mode: "voice_chat",
      sessionId: "session-2",
      tenantId: "tenant-1",
      text: "Please approve this contract.",
      now: new Date("2026-07-14T00:00:00.000Z")
    });

    expect(result.finalState).toBe("escalated");
    expect(result.providerStatus).toBe("requires_human_review");
  });
});