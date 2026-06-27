import { describe, expect, it } from "vitest";
import { getLiveProviderRuntimeConfig } from "../src/provider-readiness";
import { getTestCallModeStatus } from "../src/test-call-mode";

describe("test call mode", () => {
  it("defaults to enabled", () => {
    const status = getTestCallModeStatus(getLiveProviderRuntimeConfig({}));

    expect(status.enabled).toBe(true);
    expect(status.productionCallsAllowed).toBe(false);
  });
});

