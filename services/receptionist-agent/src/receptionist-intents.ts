import type {
  ReceptionistIntentCategory,
  ReceptionistPriority,
  ReceptionistSentiment
} from "@bidayax/types";

const intentRules = [
  {
    intent: "urgent_executive_attention",
    patterns: [/urgent/i, /emergency/i, /immediately/i, /right away/i]
  },
  {
    intent: "investor_interest",
    patterns: [/invest/i, /funding/i, /capital/i, /term sheet/i]
  },
  {
    intent: "partnership_interest",
    patterns: [/partner/i, /partnership/i, /collaborat/i, /strategic alliance/i]
  },
  {
    intent: "schedule_meeting",
    patterns: [/schedule/i, /meeting/i, /calendar/i, /appointment/i, /book/i]
  },
  {
    intent: "request_callback",
    patterns: [/call back/i, /callback/i, /return my call/i, /phone me/i]
  },
  {
    intent: "vendor_inquiry",
    patterns: [/vendor/i, /supplier/i, /proposal/i, /sell you/i]
  },
  {
    intent: "support_request",
    patterns: [/support/i, /help/i, /issue/i, /problem/i, /complaint/i]
  },
  {
    intent: "wrong_number",
    patterns: [/wrong number/i, /wrong person/i, /mistake/i]
  },
  {
    intent: "spam_or_low_value",
    patterns: [/free offer/i, /guaranteed/i, /crypto/i, /lottery/i]
  },
  {
    intent: "general_inquiry",
    patterns: [/question/i, /information/i, /learn more/i, /details/i]
  }
] as const satisfies readonly {
  readonly intent: ReceptionistIntentCategory;
  readonly patterns: readonly RegExp[];
}[];

const sentimentRules = [
  {
    sentiment: "negative",
    patterns: [/upset/i, /angry/i, /frustrated/i, /complaint/i, /bad experience/i]
  },
  {
    sentiment: "positive",
    patterns: [/thank/i, /excited/i, /great/i, /appreciate/i, /interested/i]
  }
] as const satisfies readonly {
  readonly sentiment: ReceptionistSentiment;
  readonly patterns: readonly RegExp[];
}[];

export function classifyReceptionistIntent(
  text: string
): ReceptionistIntentCategory {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return "unknown";
  }

  const rule = intentRules.find((candidate) =>
    candidate.patterns.some((pattern) => pattern.test(normalizedText))
  );

  return rule?.intent ?? "unknown";
}

export function classifyReceptionistSentiment(
  text: string
): ReceptionistSentiment {
  const rule = sentimentRules.find((candidate) =>
    candidate.patterns.some((pattern) => pattern.test(text))
  );

  return rule?.sentiment ?? "neutral";
}

export function getPriorityForIntent({
  intent,
  sentiment
}: {
  readonly intent: ReceptionistIntentCategory;
  readonly sentiment: ReceptionistSentiment;
}): ReceptionistPriority {
  if (intent === "urgent_executive_attention") {
    return "urgent";
  }

  if (intent === "investor_interest") {
    return "high";
  }

  if (intent === "partnership_interest" || intent === "schedule_meeting") {
    return sentiment === "negative" ? "high" : "medium";
  }

  if (intent === "request_callback" || intent === "support_request") {
    return sentiment === "negative" ? "high" : "medium";
  }

  if (intent === "unknown") {
    return "medium";
  }

  return "low";
}
