import { describe, expect, it } from "vitest";

import { buildImagePreservationPlan } from "../src/image-preservation.js";

describe("image preservation plan", () => {
  it("preserves the exact card rollback tag", () => {
    const plan = buildImagePreservationPlan("card", "sha256:123");

    expect(plan.requestedRollbackTag).toBe("the-executive-card-card:rollback-20260722");
    expect(plan.taggingCommands).toEqual(["docker image tag sha256:123 the-executive-card-card:rollback-20260722"]);
  });
});
