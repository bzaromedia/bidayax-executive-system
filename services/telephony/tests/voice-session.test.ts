import { describe, expect, it } from "vitest";
import { prepareVoiceSession } from "../src/voice-session";

describe("prepareVoiceSession", () => {
  it("prepares a blocked-by-default future voice session model", () => {
    const session = prepareVoiceSession({
      callId: "call_1",
      language: "English",
      provider: "mock"
    });

    expect(session).toEqual(
      expect.objectContaining({
        callId: "call_1",
        provider: "mock",
        status: "prepared",
        summaryStatus: "none",
        transcriptStatus: "none"
      })
    );
  });
});
