import { describe, expect, it } from "vitest";
import { executeWorkflow } from "../src/index";

describe("workflow engine", () => {
  it("executes typed nodes in order", async () => {
    const result = await executeWorkflow({
      context: { count: 0 },
      nodes: [
        {
          id: "first",
          label: "First",
          run: (context) => ({ count: context.count + 1 })
        },
        {
          id: "approval",
          label: "Approval",
          requiresHumanApproval: true,
          run: (context) => ({ count: context.count + 1 })
        }
      ],
      now: () => new Date("2026-07-04T00:00:00.000Z")
    });

    expect(result.context.count).toBe(2);
    expect(result.steps.map((step) => step.nodeId)).toEqual(["first", "approval"]);
    expect(result.steps[1]?.status).toBe("requires_human_review");
  });
});
