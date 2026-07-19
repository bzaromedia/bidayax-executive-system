import { describe, expect, it } from "vitest";
import {
  communicationEventTypes,
  communicationEventVersion
} from "../src/events";

describe("communications domain events", () => {
  it("uses a versioned event taxonomy", () => {
    expect(communicationEventVersion).toBe("1");
  });

  it("covers the required channel-neutral lifecycle events", () => {
    expect(communicationEventTypes).toEqual([
      "communication.requested",
      "communication.policy_checked",
      "communication.authorized",
      "communication.blocked",
      "communication.queued",
      "communication.dispatched",
      "communication.accepted",
      "communication.active",
      "communication.completed",
      "communication.failed",
      "communication.cancelled",
      "communication.escalated",
      "communication.suppressed",
      "communication.kill_switch_applied",
      "communication.adapter_degraded",
      "communication.adapter_recovered"
    ]);
  });
});
