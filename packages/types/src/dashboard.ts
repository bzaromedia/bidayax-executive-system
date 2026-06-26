import type { ExecutiveSlug, InteractionEventType } from "./events";
import type { IntentReasonCode, IntentScoringVersion, IntentTier } from "./intent";

export type DashboardStatus = "ready" | "not_configured" | "query_failed";

export type DashboardMetricKey =
  | "total_interactions"
  | "card_views"
  | "vcard_downloads"
  | "call_clicks"
  | "email_clicks"
  | "website_clicks"
  | "most_active_executive"
  | "highest_intent_action";

export type DashboardMetric = {
  readonly key: DashboardMetricKey;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
};

export type DashboardExecutiveBreakdown = {
  readonly executiveSlug: ExecutiveSlug;
  readonly executiveName: string;
  readonly count: number;
  readonly share: number;
};

export type DashboardEventTypeBreakdown = {
  readonly eventType: InteractionEventType;
  readonly label: string;
  readonly count: number;
  readonly share: number;
};

export type DashboardConversionSummary = {
  readonly key:
    | "vcard_conversion"
    | "call_conversion"
    | "email_conversion"
    | "website_conversion";
  readonly label: string;
  readonly numeratorEventType: InteractionEventType;
  readonly numerator: number;
  readonly denominatorEventType: "card_view";
  readonly denominator: number;
  readonly rate: number;
  readonly displayValue: string;
};

export type DashboardRecentInteraction = {
  readonly id: string;
  readonly eventType: InteractionEventType;
  readonly executiveSlug: ExecutiveSlug;
  readonly executiveName: string;
  readonly deviceType: string;
  readonly browser: string;
  readonly os: string;
  readonly sourceUrl: string | null;
  readonly referrer: string | null;
  readonly createdAt: string;
};

export type DashboardDailyCount = {
  readonly date: string;
  readonly count: number;
};

export type DashboardIntentSignal = {
  readonly id: string;
  readonly label: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly executiveName: string;
  readonly score: number;
  readonly tier: IntentTier;
  readonly reasonCodes: readonly IntentReasonCode[];
  readonly scoringVersion: IntentScoringVersion;
  readonly eventCount: number;
  readonly lastEventAt: string | null;
};

export type DashboardIntentTierBreakdown = {
  readonly tier: IntentTier;
  readonly count: number;
  readonly share: number;
};

export type DashboardExecutiveIntentSummary = {
  readonly executiveSlug: ExecutiveSlug;
  readonly executiveName: string;
  readonly signalCount: number;
  readonly averageScore: number;
  readonly maxScore: number;
};

export type ExecutiveInteractionDashboardData = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
  readonly generatedAt: string;
  readonly totalInteractions: number;
  readonly metrics: readonly DashboardMetric[];
  readonly executiveBreakdown: readonly DashboardExecutiveBreakdown[];
  readonly eventTypeBreakdown: readonly DashboardEventTypeBreakdown[];
  readonly conversions: readonly DashboardConversionSummary[];
  readonly recentInteractions: readonly DashboardRecentInteraction[];
  readonly dailyCounts: readonly DashboardDailyCount[];
  readonly topIntentSignals: readonly DashboardIntentSignal[];
  readonly intentTierBreakdown: readonly DashboardIntentTierBreakdown[];
  readonly executiveIntentSummary: readonly DashboardExecutiveIntentSummary[];
};
