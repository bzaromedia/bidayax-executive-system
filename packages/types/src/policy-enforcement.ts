import type {
  DataClassification,
  DataTrustEvidenceType
} from "./data-trust";

export const policyActions = [
  "read",
  "write",
  "export",
  "share",
  "execute",
  "promote",
  "verify",
  "revoke"
] as const;

export type PolicyAction = (typeof policyActions)[number];

export const policyDecisionTypes = ["allowed", "warning", "blocked"] as const;

export type PolicyDecision = (typeof policyDecisionTypes)[number];

export const policyRuleEffects = ["allow", "warn", "block"] as const;

export type PolicyRuleEffect = (typeof policyRuleEffects)[number];

export type PolicySubject = {
  readonly id: string;
  readonly type: "user" | "service" | "agent" | "system";
  readonly roles: readonly string[];
  readonly tenantId?: string | null;
};

export type PolicyResource = {
  readonly id: string;
  readonly type: string;
  readonly classification: DataClassification;
  readonly tenantId?: string | null;
  readonly trustScore?: number | null;
  readonly evidenceTypes?: readonly DataTrustEvidenceType[];
};

export type PolicyEvaluationContext = {
  readonly correlationId?: string | null;
  readonly humanApprovalId?: string | null;
  readonly purpose?: string | null;
  readonly requestedAt?: string | null;
};

export type PolicyEvaluationRequest = {
  readonly subject: PolicySubject;
  readonly action: PolicyAction;
  readonly resource: PolicyResource;
  readonly context?: PolicyEvaluationContext;
};

export type PolicyRule = {
  readonly id: string;
  readonly description: string;
  readonly effect: PolicyRuleEffect;
  readonly actions: readonly PolicyAction[];
  readonly classifications: readonly DataClassification[];
  readonly reasonCode: string;
  readonly belowTrustScore?: number | null;
  readonly requiredEvidenceTypes?: readonly DataTrustEvidenceType[];
  readonly requireHumanApproval?: boolean;
};

export type PolicyEvaluationResult = {
  readonly allowed: boolean;
  readonly decision: PolicyDecision;
  readonly evaluatedAt: string;
  readonly explanation: readonly string[];
  readonly matchedRuleIds: readonly string[];
  readonly reasonCodes: readonly string[];
};

export function isPolicyAction(value: string): value is PolicyAction {
  return (policyActions as readonly string[]).includes(value);
}
