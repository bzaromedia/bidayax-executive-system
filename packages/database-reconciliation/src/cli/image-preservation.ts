import { buildImagePreservationPlan } from "../image-preservation.ts";

const service = process.argv[2];
const expectedImageId = process.argv[3];
const observedImageId = process.argv[4];
const rollbackTag = process.argv[5];
const existingTagImageId = process.argv[6];

if ((service !== "card" && service !== "dashboard") || !expectedImageId || !observedImageId || !rollbackTag) {
  console.error(
    "Usage: image-preservation <card|dashboard> <expected-image-id> <observed-image-id> <rollback-tag> [existing-tag-image-id]"
  );
  process.exit(1);
}

const plan = buildImagePreservationPlan({
  service,
  expectedImageId,
  observedImageId,
  rollbackTag,
  ...(existingTagImageId ? { existingTagImageId } : {})
});

console.log(JSON.stringify(plan, null, 2));

if (plan.equalityResult !== "MATCH") {
  process.exit(2);
}
