import type { CallIntent } from "@bidayax/types";

const intentTerms = {
  sales: ["buy", "pricing", "demo", "sales", "package", "purchase"],
  investor: ["invest", "investment", "investor", "funding", "capital", "valuation"],
  customer: ["customer", "client", "account", "existing", "renewal"],
  partner: ["partner", "partnership", "reseller", "agency", "white label"],
  vendor: ["vendor", "supplier", "invoice", "procurement"],
  media: ["media", "press", "interview", "journalist", "podcast"],
  legal: ["legal", "attorney", "lawsuit", "contract", "subpoena", "compliance"],
  emergency: ["emergency", "urgent", "asap", "immediately", "critical"],
  personal: ["personal", "family", "friend"],
  spam: ["crypto giveaway", "lottery", "guaranteed returns", "free money", "seo backlink"]
} as const satisfies Record<Exclude<CallIntent, "unknown">, readonly string[]>;

export type PolyglotIntentRoutingResult = {
  readonly intent: CallIntent;
  readonly confidence: number;
  readonly reasonCodes: readonly string[];
};

export function routePolyglotCallIntent(input: {
  readonly transcript: string;
  readonly requestedAction?: string | null;
}): PolyglotIntentRoutingResult {
  const text = `${input.requestedAction ?? ""} ${input.transcript}`.toLowerCase();
  const matches = Object.entries(intentTerms)
    .map(([intent, terms]) => ({
      intent: intent as CallIntent,
      hitCount: terms.filter((term) => text.includes(term)).length
    }))
    .filter((match) => match.hitCount > 0)
    .sort((left, right) => right.hitCount - left.hitCount);

  const top = matches[0];

  if (!top) {
    return {
      confidence: 0.35,
      intent: "unknown",
      reasonCodes: ["no_keyword_match"]
    };
  }

  return {
    confidence: Math.min(0.95, 0.55 + top.hitCount * 0.2),
    intent: top.intent,
    reasonCodes: [`${top.intent}_keyword_match`]
  };
}
