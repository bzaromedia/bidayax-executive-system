import { describe, expect, it } from "vitest";
import type { TelephonyCallRoutingRule } from "@bidayax/types";
import { evaluateTelephonyRouting } from "../src/routing-policy";

const rules: readonly TelephonyCallRoutingRule[] = [
  {
    action: "escalate",
    condition: {},
    createdAt: "2026-07-13T00:00:00.000Z",
    destination: "human-escalation",
    enabled: true,
    priority: 1,
    ruleId: "emergency-rule",
    ruleType: "emergency",
    tenantId: "tenant-1",
    updatedAt: "2026-07-13T00:00:00.000Z"
  },
  {
    action: "queue_callback",
    condition: {},
    createdAt: "2026-07-13T00:00:00.000Z",
    destination: null,
    enabled: true,
    priority: 10,
    ruleId: "after-hours-rule",
    ruleType: "after_hours",
    tenantId: "tenant-1",
    updatedAt: "2026-07-13T00:00:00.000Z"
  }
];

describe("routing policy", () => {
  it("prioritizes emergency escalation", () => {
    const decision = evaluateTelephonyRouting({
      context: {
        cardId: "card-1",
        executiveAvailable: false,
        isAfterHours: true,
        isEmergency: true,
        isHoliday: false,
        queueDepth: 0,
        tenantId: "tenant-1"
      },
      rules
    });

    expect(decision.action).toBe("escalate");
    expect(decision.requiresHumanApproval).toBe(true);
    expect(decision.matchedRuleId).toBe("emergency-rule");
  });

  it("falls back to safe callback queue", () => {
    const decision = evaluateTelephonyRouting({
      context: {
        cardId: "card-1",
        executiveAvailable: true,
        isAfterHours: false,
        isEmergency: false,
        isHoliday: false,
        queueDepth: 0,
        tenantId: "tenant-1"
      },
      rules: []
    });

    expect(decision.action).toBe("queue_callback");
    expect(decision.reasonCodes).toContain("DEFAULT_CALLBACK_QUEUE");
    expect(decision.requiresHumanApproval).toBe(true);
  });
});
