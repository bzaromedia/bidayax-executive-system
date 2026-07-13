import { describe, expect, it } from "vitest";
import {
  canTransitionAppointmentState,
  canTransitionCallbackState,
  canTransitionDomainCallState,
  canTransitionVoicemailState,
  transitionAppointmentState,
  transitionCallbackState,
  transitionDomainCallState,
  transitionVoicemailState
} from "../src/domain-state-machines";

describe("telephony domain state machines", () => {
  it("allows deterministic call lifecycle transitions", () => {
    expect(canTransitionDomainCallState({ from: "requested", to: "queued" })).toBe(true);
    expect(transitionDomainCallState({ from: "ringing", to: "answered" })).toBe("answered");
    expect(transitionDomainCallState({ from: "in_conversation", to: "held" })).toBe("held");
  });

  it("rejects impossible call lifecycle transitions", () => {
    expect(canTransitionDomainCallState({ from: "completed", to: "queued" })).toBe(false);
    expect(() =>
      transitionDomainCallState({ from: "completed", to: "queued" })
    ).toThrow("Invalid call transition from completed to queued.");
  });

  it("validates callback, appointment, and voicemail lifecycles", () => {
    expect(canTransitionCallbackState({ from: "requested", to: "scheduled" })).toBe(true);
    expect(transitionCallbackState({ from: "assigned", to: "attempting" })).toBe("attempting");
    expect(canTransitionAppointmentState({ from: "requested", to: "pending" })).toBe(true);
    expect(transitionAppointmentState({ from: "confirmed", to: "completed" })).toBe("completed");
    expect(canTransitionVoicemailState({ from: "received", to: "stored" })).toBe(true);
    expect(transitionVoicemailState({ from: "stored", to: "processed" })).toBe("processed");
  });

  it("keeps terminal states terminal", () => {
    expect(canTransitionCallbackState({ from: "completed", to: "scheduled" })).toBe(false);
    expect(canTransitionAppointmentState({ from: "cancelled", to: "pending" })).toBe(false);
    expect(canTransitionVoicemailState({ from: "archived", to: "stored" })).toBe(false);
  });
});
