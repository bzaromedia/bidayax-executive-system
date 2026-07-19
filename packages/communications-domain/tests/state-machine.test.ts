import { describe, expect, it } from "vitest";
import {
  canTransitionCommunicationLifecycleState,
  communicationLifecycleStates,
  communicationTerminalStates,
  transitionCommunicationLifecycleState
} from "../src/state-machines";

describe("communications lifecycle state machine", () => {
  it("defines the required channel-neutral states", () => {
    expect(communicationLifecycleStates).toEqual([
      "requested",
      "policy_checking",
      "authorized",
      "queued",
      "dispatching",
      "accepted",
      "active",
      "completed",
      "blocked",
      "cancelled",
      "failed",
      "expired",
      "suppressed",
      "terminated"
    ]);
  });

  it("permits valid transitions and rejects invalid ones", () => {
    expect(
      transitionCommunicationLifecycleState({
        from: "requested",
        to: "policy_checking"
      })
    ).toBe("policy_checking");
    expect(
      canTransitionCommunicationLifecycleState({
        from: "completed",
        to: "active"
      })
    ).toBe(false);
    expect(() =>
      transitionCommunicationLifecycleState({
        from: "completed",
        to: "active"
      })
    ).toThrow(/Invalid communication lifecycle transition/);
  });

  it("keeps terminal states terminal", () => {
    expect(communicationTerminalStates).toContain("completed");
    expect(communicationTerminalStates).toContain("blocked");
    expect(communicationTerminalStates).toContain("terminated");
  });
});
