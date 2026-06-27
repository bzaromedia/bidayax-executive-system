import { describe, expect, it } from "vitest";
import { evaluateEscalation } from "../src/escalation-rules";

describe("evaluateEscalation", () => {
  it("recommends escalation for executive approval tasks", () => {
    const result = evaluateEscalation({
      intent: "investor_interest",
      priority: "high",
      sentiment: "positive",
      tasks: [
        {
          assignedTo: null,
          description: "Simulated task",
          dueAt: null,
          priority: "high",
          status: "simulated",
          taskType: "escalate_to_executive"
        }
      ]
    });

    expect(result.shouldEscalate).toBe(true);
    expect(result.reasonCodes).toContain("INVESTOR_INTEREST");
    expect(result.recommendation).toContain("No executive is contacted");
  });
});
