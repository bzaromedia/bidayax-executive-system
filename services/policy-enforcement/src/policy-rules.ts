import type { PolicyRule } from "@bidayax/types";

export const defaultPolicyRules: readonly PolicyRule[] = [
  {
    actions: ["read", "write", "export", "share", "execute", "promote", "verify", "revoke"],
    classifications: ["public", "internal", "confidential", "restricted"],
    belowTrustScore: 40,
    description: "Block actions against resources with untrusted evidence.",
    effect: "block",
    id: "block-untrusted-resource",
    reasonCode: "RESOURCE_TRUST_SCORE_TOO_LOW"
  },
  {
    actions: ["read", "write", "export", "share", "execute", "promote", "verify", "revoke"],
    classifications: ["public", "internal", "confidential", "restricted"],
    belowTrustScore: 65,
    description: "Warn when a resource has weak evidence support.",
    effect: "warn",
    id: "warn-weak-resource-evidence",
    reasonCode: "RESOURCE_TRUST_SCORE_REQUIRES_REVIEW"
  },
  {
    actions: ["export", "share", "execute", "promote"],
    classifications: ["restricted"],
    description: "Block restricted high-impact actions without human approval.",
    effect: "block",
    id: "block-restricted-without-approval",
    reasonCode: "RESTRICTED_ACTION_REQUIRES_HUMAN_APPROVAL",
    requireHumanApproval: true
  },
  {
    actions: ["export", "share"],
    classifications: ["confidential", "restricted"],
    description: "Warn when sensitive data lacks lineage and provenance evidence.",
    effect: "warn",
    id: "warn-sensitive-export-without-lineage",
    reasonCode: "SENSITIVE_DATA_LINEAGE_REVIEW_REQUIRED",
    requiredEvidenceTypes: ["lineage", "provenance"]
  }
];
