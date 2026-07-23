import { approvedRollbackImageIds, rollbackImageTags } from "./canonical-contract.js";
import type { ImagePreservationPlan, ImagePreservationRequest } from "./types.js";

const imageIdPattern = /^sha256:[a-f0-9]{64}$/;

function normalizeImageId(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return imageIdPattern.test(normalized) ? normalized : null;
}

function buildPlan(
  request: ImagePreservationRequest,
  equalityResult: ImagePreservationPlan["equalityResult"],
  refusalReason?: string
): ImagePreservationPlan {
  const normalizedObserved = normalizeImageId(request.observedImageId) ?? request.observedImageId.trim();
  const normalizedExpected = normalizeImageId(request.expectedImageId) ?? request.expectedImageId.trim();
  const normalizedExisting = normalizeImageId(request.existingTagImageId);
  const taggingCommands =
    equalityResult === "MATCH" && normalizedExisting !== normalizedObserved
      ? [`docker image tag ${normalizedObserved} ${request.rollbackTag}`]
      : [];

  return {
    service: request.service,
    expectedImageId: normalizedExpected,
    observedImageId: normalizedObserved,
    rollbackTag: request.rollbackTag,
    equalityResult,
    verificationCommands: [
      `docker image inspect --format '{{.Id}}' ${normalizedObserved}`,
      `docker image inspect --format '{{.Id}}' ${request.rollbackTag}`
    ],
    taggingCommands,
    ...(refusalReason ? { refusalReason } : {}),
    evidenceFields: [
      "operationId",
      "timestampUtc",
      "service",
      "expectedImageId",
      "observedImageId",
      "rollbackTag",
      "operatorAuthorizationReference"
    ]
  };
}

export function buildImagePreservationPlan(request: ImagePreservationRequest): ImagePreservationPlan {
  const approvedImageId = approvedRollbackImageIds[request.service];
  const approvedRollbackTag = rollbackImageTags[request.service];
  const expectedImageId = normalizeImageId(request.expectedImageId);
  const observedImageId = normalizeImageId(request.observedImageId);
  const existingTagImageId = normalizeImageId(request.existingTagImageId);

  if (!approvedImageId || request.rollbackTag !== approvedRollbackTag) {
    return buildPlan(request, "INVALID", "rollback tag is not approved for the requested service");
  }

  if (expectedImageId === null) {
    return buildPlan(request, "INVALID", "expected image id must be a full sha256 image identifier");
  }

  if (observedImageId === null) {
    return buildPlan(request, "INVALID", "observed image id must be a full sha256 image identifier");
  }

  if (request.existingTagImageId !== undefined && existingTagImageId === null) {
    return buildPlan(request, "INVALID", "existing rollback tag image id must be a full sha256 image identifier");
  }

  if (expectedImageId !== approvedImageId) {
    return buildPlan(request, "INVALID", "expected image id does not match the approved rollback image identity");
  }

  if (expectedImageId !== observedImageId) {
    return buildPlan(request, "MISMATCH", "observed image id does not match the approved expected image identity");
  }

  if (existingTagImageId !== null && existingTagImageId !== observedImageId) {
    return buildPlan(request, "MISMATCH", "existing rollback tag points to a different image identity");
  }

  return buildPlan(request, "MATCH");
}
