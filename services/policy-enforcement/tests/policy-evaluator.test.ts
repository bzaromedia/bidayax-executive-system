import { describe, expect, it } from "vitest";
import type { PolicyEvaluationRequest } from "@bidayax/types";
import { evaluatePolicy } from "../src/policy-evaluator";

const baseRequest: PolicyEvaluationRequest = {
  action: "read",
  context: {
    requestedAt: "2026-07-01T00:00:00.000Z"
  },
  resource: {
    classification: "internal",
    evidenceTypes: ["source_record", "lineage", "provenance"],
    id: "resource-1",
    tenantId: "tenant-1",
    trustScore: 92,
    type: "interaction"
  },
  subject: {
    id: "user-1",
    roles: ["operator"],
    tenantId: "tenant-1",
    type: "user"
  }
};

describe("evaluatePolicy", () => {
  it("allows a supported same-tenant read", () => {
    const result = evaluatePolicy(baseRequest);

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe("allowed");
    expect(result.reasonCodes).toEqual([]);
  });

  it("blocks tenant boundary violations", () => {
    const result = evaluatePolicy({
      ...baseRequest,
      resource: {
        ...baseRequest.resource,
        tenantId: "tenant-2"
      }
    });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe("blocked");
    expect(result.reasonCodes).toContain("TENANT_BOUNDARY_VIOLATION");
  });

  it("warns for weak resource trust scores", () => {
    const result = evaluatePolicy({
      ...baseRequest,
      resource: {
        ...baseRequest.resource,
        trustScore: 55
      }
    });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe("warning");
    expect(result.reasonCodes).toContain("RESOURCE_TRUST_SCORE_REQUIRES_REVIEW");
  });

  it("blocks restricted export without human approval", () => {
    const result = evaluatePolicy({
      ...baseRequest,
      action: "export",
      resource: {
        ...baseRequest.resource,
        classification: "restricted",
        trustScore: 90
      }
    });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe("blocked");
    expect(result.reasonCodes).toContain(
      "RESTRICTED_ACTION_REQUIRES_HUMAN_APPROVAL"
    );
  });

  it("allows restricted export with human approval and evidence", () => {
    const result = evaluatePolicy({
      ...baseRequest,
      action: "export",
      context: {
        humanApprovalId: "approval-1",
        requestedAt: "2026-07-01T00:00:00.000Z"
      },
      resource: {
        ...baseRequest.resource,
        classification: "restricted",
        evidenceTypes: ["source_record", "lineage", "provenance", "approval"],
        trustScore: 90
      }
    });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe("allowed");
    expect(result.reasonCodes).toEqual([]);
  });
});
