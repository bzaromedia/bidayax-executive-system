import { describe, expect, it } from "vitest";

import { approvedRollbackImageIds, rollbackImageTags } from "../src/canonical-contract.js";
import { buildImagePreservationPlan } from "../src/image-preservation.js";

describe("image preservation plan", () => {
  it("produces a tag plan only for the approved expected card image", () => {
    const plan = buildImagePreservationPlan({
      service: "card",
      expectedImageId: approvedRollbackImageIds.card,
      observedImageId: approvedRollbackImageIds.card,
      rollbackTag: rollbackImageTags.card
    });

    expect(plan.equalityResult).toBe("MATCH");
    expect(plan.taggingCommands).toEqual([
      `docker image tag ${approvedRollbackImageIds.card} ${rollbackImageTags.card}`
    ]);
  });

  it("refuses a mismatched observed image identity", () => {
    const plan = buildImagePreservationPlan({
      service: "card",
      expectedImageId: approvedRollbackImageIds.card,
      observedImageId: approvedRollbackImageIds.dashboard,
      rollbackTag: rollbackImageTags.card
    });

    expect(plan.equalityResult).toBe("MISMATCH");
    expect(plan.taggingCommands).toEqual([]);
  });

  it("refuses an unapproved expected image identity", () => {
    const plan = buildImagePreservationPlan({
      service: "dashboard",
      expectedImageId: approvedRollbackImageIds.card,
      observedImageId: approvedRollbackImageIds.card,
      rollbackTag: rollbackImageTags.dashboard
    });

    expect(plan.equalityResult).toBe("INVALID");
    expect(plan.refusalReason).toContain("approved rollback image identity");
  });

  it("does not retag when the rollback tag already points at the approved image", () => {
    const plan = buildImagePreservationPlan({
      service: "dashboard",
      expectedImageId: approvedRollbackImageIds.dashboard,
      observedImageId: approvedRollbackImageIds.dashboard,
      rollbackTag: rollbackImageTags.dashboard,
      existingTagImageId: approvedRollbackImageIds.dashboard
    });

    expect(plan.equalityResult).toBe("MATCH");
    expect(plan.taggingCommands).toEqual([]);
  });
});
