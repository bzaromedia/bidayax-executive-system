import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { telephonyChannelAdapterContract } from "../src/communications-telephony-adapter-contract";

function readPublicExportSpecifiers() {
  const indexSource = readFileSync(resolve(process.cwd(), "src/index.ts"), "utf8");
  const matches = indexSource.matchAll(
    /\bexport\b[\s\S]*?\bfrom\s+["']([^"']+)["']/g
  );

  return Array.from(matches, (match) => match[1]).sort();
}

describe("telephony channel adapter contract", () => {
  it("declares telephony as a communications-channel adapter", () => {
    expect(telephonyChannelAdapterContract.channel).toBe("telephony");
    expect(telephonyChannelAdapterContract.executionMode).toBe("sandbox_only");
  });

  it("keeps policy ownership outside the telephony adapter", () => {
    expect(telephonyChannelAdapterContract.prohibitedOwnership).toContain(
      "tenant_authorization"
    );
    expect(telephonyChannelAdapterContract.prohibitedOwnership).toContain(
      "production_activation_authority"
    );
  });

  it("publishes only the approved adapter and readiness modules", () => {
    expect(readPublicExportSpecifiers()).toEqual([
      "./communications-telephony-adapter-contract",
      "./mock-telephony-provider",
      "./provider-readiness",
      "./test-call-mode",
      "./voice-runtime-readiness"
    ]);
  });
});