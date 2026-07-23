import { buildImagePreservationPlan } from "../image-preservation.js";

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

console.log(
  JSON.stringify(
    buildImagePreservationPlan({
      service,
      expectedImageId,
      observedImageId,
      rollbackTag,
      ...(existingTagImageId ? { existingTagImageId } : {})
    }),
    null,
    2
  )
);
