import { describe, expect, it } from "vitest";
import { generateSafeTwimlResponse } from "../src/twiml-response";

describe("TwiML response", () => {
  it("generates a safe TwiML response", () => {
    const twiml = generateSafeTwimlResponse({ testMode: true });

    expect(twiml).toContain("<Response>");
    expect(twiml).toContain("<Hangup/>");
    expect(twiml).not.toContain("autonomous");
  });

  it("escapes response text", () => {
    const twiml = generateSafeTwimlResponse({
      message: "Testing <safe> & controlled",
      testMode: true
    });

    expect(twiml).toContain("Testing &lt;safe&gt; &amp; controlled");
  });
});

