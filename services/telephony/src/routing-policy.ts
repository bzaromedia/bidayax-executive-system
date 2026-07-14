import type { TelephonyCallRoutingRule } from "@bidayax/types";

export type TelephonyRoutingContext = {
  readonly tenantId: string;
  readonly cardId: string;
  readonly language?: string | null;
  readonly isAfterHours: boolean;
  readonly isHoliday: boolean;
  readonly isEmergency: boolean;
  readonly executiveAvailable: boolean;
  readonly queueDepth: number;
};

export type TelephonyRoutingDecision = {
  readonly action: TelephonyCallRoutingRule["action"];
  readonly destination: string | null;
  readonly matchedRuleId: string | null;
  readonly reasonCodes: readonly string[];
  readonly requiresHumanApproval: boolean;
};

function conditionMatches(rule: TelephonyCallRoutingRule, context: TelephonyRoutingContext) {
  if (!rule.enabled) {
    return false;
  }

  if (rule.cardId && rule.cardId !== context.cardId) {
    return false;
  }

  if (rule.tenantId !== context.tenantId) {
    return false;
  }

  switch (rule.ruleType) {
    case "after_hours":
      return context.isAfterHours;
    case "business_hours":
      return !context.isAfterHours && !context.isHoliday;
    case "emergency":
      return context.isEmergency;
    case "executive_unavailable":
      return !context.executiveAvailable;
    case "holiday":
      return context.isHoliday;
    case "language":
      return rule.condition.language === context.language;
    case "overflow":
      return typeof rule.condition.maxDepth === "number"
        ? context.queueDepth >= rule.condition.maxDepth
        : false;
    default:
      return true;
  }
}

export function evaluateTelephonyRouting({
  context,
  rules
}: {
  readonly context: TelephonyRoutingContext;
  readonly rules: readonly TelephonyCallRoutingRule[];
}): TelephonyRoutingDecision {
  const matchedRule = [...rules]
    .filter((rule) => conditionMatches(rule, context))
    .sort((left, right) => left.priority - right.priority)[0];

  if (!matchedRule) {
    return {
      action: "queue_callback",
      destination: null,
      matchedRuleId: null,
      reasonCodes: ["DEFAULT_CALLBACK_QUEUE"],
      requiresHumanApproval: true
    };
  }

  return {
    action: matchedRule.action,
    destination: matchedRule.destination ?? null,
    matchedRuleId: matchedRule.ruleId,
    reasonCodes: [`RULE_${matchedRule.ruleType.toUpperCase()}_MATCHED`],
    requiresHumanApproval: matchedRule.action === "escalate" || matchedRule.ruleType === "emergency"
  };
}
