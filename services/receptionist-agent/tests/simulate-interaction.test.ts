import { describe, expect, it } from "vitest";
import { simulateReceptionistInteraction } from "../src/simulate-interaction";

const baseInput = {
  channel: "phone",
  executiveSlug: "ad-garner",
  interactionType: "inbound_call",
  language: "English"
} as const;

describe("simulateReceptionistInteraction", () => {
  it("classifies a simulated scheduling request", () => {
    const result = simulateReceptionistInteraction({
      ...baseInput,
      text: "I would like to schedule a meeting next week."
    });

    expect(result.classifiedIntent).toBe("schedule_meeting");
    expect(result.tasks[0]?.taskType).toBe("schedule_meeting");
  });

  it("classifies a simulated investor inquiry and recommends escalation", () => {
    const result = simulateReceptionistInteraction({
      ...baseInput,
      text: "We are investors interested in funding and would like to discuss capital."
    });

    expect(result.classifiedIntent).toBe("investor_interest");
    expect(result.escalation.shouldEscalate).toBe(true);
  });

  it("classifies a simulated callback request", () => {
    const result = simulateReceptionistInteraction({
      ...baseInput,
      text: "Please call back when available."
    });

    expect(result.classifiedIntent).toBe("request_callback");
    expect(result.tasks[0]?.taskType).toBe("return_call");
  });

  it("classifies a simulated wrong number", () => {
    const result = simulateReceptionistInteraction({
      ...baseInput,
      text: "Sorry, wrong number."
    });

    expect(result.classifiedIntent).toBe("wrong_number");
    expect(result.tasks[0]?.taskType).toBe("review_transcript");
  });

  it("handles simulated unknown intent", () => {
    const result = simulateReceptionistInteraction({
      ...baseInput,
      text: "Blue folder near the lobby."
    });

    expect(result.classifiedIntent).toBe("unknown");
    expect(result.tasks[0]?.taskType).toBe("review_transcript");
  });

  it("creates workflow events", () => {
    const result = simulateReceptionistInteraction({
      ...baseInput,
      text: "Can I schedule a meeting?"
    });

    expect(result.workflowEvents.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "interaction_created",
        "language_detected",
        "intent_classified",
        "task_created",
        "summary_generated",
        "workflow_completed"
      ])
    );
  });

  it("returns identical output for identical input", () => {
    const input = {
      ...baseInput,
      text: "Can I schedule a meeting?"
    };

    expect(simulateReceptionistInteraction(input)).toEqual(
      simulateReceptionistInteraction(input)
    );
  });
});
