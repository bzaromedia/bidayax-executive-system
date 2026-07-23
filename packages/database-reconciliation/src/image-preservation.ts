import { rollbackImageTags } from "./canonical-contract.js";
import type { ImagePreservationPlan } from "./types.js";

export function buildImagePreservationPlan(kind: "card" | "dashboard", sourceImageId: string): ImagePreservationPlan {
  const rollbackTag = rollbackImageTags[kind];

  return {
    sourceImageId,
    requestedRollbackTag: rollbackTag,
    verificationCommands: [
      `docker image inspect ${sourceImageId}`,
      `docker image inspect ${rollbackTag}`
    ],
    taggingCommands: [
      `docker image tag ${sourceImageId} ${rollbackTag}`
    ],
    evidenceFields: [
      "operationId",
      "timestampUtc",
      "sourceImageId",
      "rollbackTag",
      "resultingDigest",
      "operatorAuthorizationReference"
    ]
  };
}
