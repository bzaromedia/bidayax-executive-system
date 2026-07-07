import { describe, expect, it } from "vitest";
import {
  createVoiceChatPlaceholderSession,
  resolveVoiceGatewayStatus
} from "../src/index";

describe("voice gateway", () => {
  it("stays provider-unconfigured until live keys are present", () => {
    expect(resolveVoiceGatewayStatus({}).status).toBe("provider_unconfigured");
    expect(
      createVoiceChatPlaceholderSession({
        env: {},
        executiveSlug: "ad-garner",
        visitorId: "visitor-1"
      }).safeMessage
    ).toContain("pending realtime voice provider configuration");
  });
});
