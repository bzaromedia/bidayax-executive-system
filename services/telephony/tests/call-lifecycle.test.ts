import { describe, expect, it } from "vitest";
import {
  canTransitionCallStatus,
  transitionCallStatus
} from "../src/call-lifecycle";

describe("call lifecycle", () => {
  it("allows valid call lifecycle transitions", () => {
    expect(canTransitionCallStatus({ from: "received", to: "queued" })).toBe(true);
    expect(transitionCallStatus({ from: "queued", to: "ringing" })).toBe("ringing");
  });

  it("rejects invalid call lifecycle transitions", () => {
    expect(canTransitionCallStatus({ from: "completed", to: "queued" })).toBe(false);
    expect(() =>
      transitionCallStatus({ from: "completed", to: "queued" })
    ).toThrow("Invalid call transition from completed to queued.");
  });
});
