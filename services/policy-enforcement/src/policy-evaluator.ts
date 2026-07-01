import type {
  PolicyEvaluationRequest,
  PolicyEvaluationResult,
  PolicyRule
} from "@bidayax/types";
import { defaultPolicyRules } from "./policy-rules";

function hasHumanApproval(request: PolicyEvaluationRequest) {
  return Boolean(request.context?.humanApprovalId);
}

function hasRequiredEvidence(
  request: PolicyEvaluationRequest,
  rule: PolicyRule
) {
  if (!rule.requiredEvidenceTypes || rule.requiredEvidenceTypes.length === 0) {
    return true;
  }

  const evidenceTypes = request.resource.evidenceTypes ?? [];

  return rule.requiredEvidenceTypes.every((type) =>
    evidenceTypes.includes(type)
  );
}

function ruleMatches(request: PolicyEvaluationRequest, rule: PolicyRule) {
  if (!rule.actions.includes(request.action)) {
    return false;
  }

  if (!rule.classifications.includes(request.resource.classification)) {
    return false;
  }

  if (
    rule.belowTrustScore !== undefined &&
    rule.belowTrustScore !== null &&
    (request.resource.trustScore ?? 0) >= rule.belowTrustScore
  ) {
    return false;
  }

  if (rule.requireHumanApproval && hasHumanApproval(request)) {
    return false;
  }

  if (
    rule.requiredEvidenceTypes &&
    rule.requiredEvidenceTypes.length > 0 &&
    hasRequiredEvidence(request, rule)
  ) {
    return false;
  }

  return true;
}

export function evaluatePolicy(
  request: PolicyEvaluationRequest,
  rules: readonly PolicyRule[] = defaultPolicyRules
): PolicyEvaluationResult {
  const evaluatedAt = request.context?.requestedAt ?? new Date().toISOString();
  const matchedRules = rules.filter((rule) => ruleMatches(request, rule));
  const reasonCodes = new Set<string>();
  const explanation: string[] = [];

  if (
    request.subject.tenantId &&
    request.resource.tenantId &&
    request.subject.tenantId !== request.resource.tenantId
  ) {
    reasonCodes.add("TENANT_BOUNDARY_VIOLATION");
    explanation.push("Subject and resource tenant identifiers do not match.");
  }

  for (const rule of matchedRules) {
    reasonCodes.add(rule.reasonCode);
    explanation.push(rule.description);
  }

  const blocked =
    reasonCodes.has("TENANT_BOUNDARY_VIOLATION") ||
    matchedRules.some((rule) => rule.effect === "block");
  const warned = matchedRules.some((rule) => rule.effect === "warn");
  const decision = blocked ? "blocked" : warned ? "warning" : "allowed";

  if (explanation.length === 0) {
    explanation.push("No blocking or warning policy rule matched.");
  }

  return {
    allowed: decision !== "blocked",
    decision,
    evaluatedAt,
    explanation,
    matchedRuleIds: matchedRules.map((rule) => rule.id).sort(),
    reasonCodes: Array.from(reasonCodes).sort()
  };
}
