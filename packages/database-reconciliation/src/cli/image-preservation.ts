import { buildImagePreservationPlan } from "../image-preservation.js";

const kind = process.argv[2];
const sourceImageId = process.argv[3];

if ((kind !== "card" && kind !== "dashboard") || !sourceImageId) {
  console.error("Usage: image-preservation <card|dashboard> <source-image-id>");
  process.exit(1);
}

console.log(JSON.stringify(buildImagePreservationPlan(kind, sourceImageId), null, 2));
