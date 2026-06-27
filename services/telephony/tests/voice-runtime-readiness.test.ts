import { describe, expect, it } from "vitest";
import { getLiveProviderRuntimeConfig } from "../src/provider-readiness";
import { prepareVoiceRuntimeReadiness } from "../src/voice-runtime-readiness";

describe("voice runtime readiness", () => {
  it("blocks voice runtime when OpenAI configuration is missing", () => {
    const readiness = prepareVoiceRuntimeReadiness(
      getLiveProviderRuntimeConfig({
        VOICE_RUNTIME_PROVIDER: "openai_realtime",
        VOICE_AGENT_ENABLED: "true"
      })
    );

    expect(readiness.status).toBe("not_configured");
    expect(readiness.reasonCodes).toContain("OPENAI_CONFIG_MISSING");
  });

  it("keeps configured OpenAI Realtime in test-only preparation by default", () => {
    const readiness = prepareVoiceRuntimeReadiness(
      getLiveProviderRuntimeConfig({
        OPENAI_API_KEY: "sk-test",
        OPENAI_REALTIME_MODEL: "gpt-realtime",
        VOICE_AGENT_ENABLED: "true",
        VOICE_RUNTIME_PROVIDER: "openai_realtime"
      })
    );

    expect(readiness.status).toBe("prepared");
    expect(readiness.testMode).toBe(true);
    expect(readiness.reasonCodes).toContain("TEST_MODE_ENABLED");
  });
});

