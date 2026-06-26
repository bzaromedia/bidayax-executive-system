import {
  executiveSlugs,
  interactionEventTypes,
  type DashboardConversionSummary,
  type DashboardDailyCount,
  type DashboardEventTypeBreakdown,
  type DashboardExecutiveBreakdown,
  type DashboardMetric,
  type DashboardRecentInteraction,
  type DashboardStatus,
  type ExecutiveInteractionDashboardData,
  type ExecutiveSlug,
  type InteractionEventType
} from "@bidayax/types";
import {
  eventTypeLabels,
  executiveLabels,
  formatInteger,
  formatPercent
} from "./formatters";

export type DashboardSourceData = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
  readonly eventCounts: ReadonlyMap<InteractionEventType, number>;
  readonly executiveCounts: ReadonlyMap<ExecutiveSlug, number>;
  readonly recentInteractions: readonly DashboardRecentInteraction[];
  readonly dailyCounts: readonly DashboardDailyCount[];
};

const actionEventTypes = [
  "call_click",
  "email_click",
  "vcard_download",
  "website_click"
] as const satisfies readonly InteractionEventType[];

function getEventCount(
  counts: ReadonlyMap<InteractionEventType, number>,
  eventType: InteractionEventType
) {
  return counts.get(eventType) ?? 0;
}

function buildMetric(
  key: DashboardMetric["key"],
  label: string,
  value: string,
  detail: string
): DashboardMetric {
  return {
    detail,
    key,
    label,
    value
  };
}

function getMostActiveExecutive(
  executiveCounts: ReadonlyMap<ExecutiveSlug, number>
) {
  return executiveSlugs.reduce<DashboardExecutiveBreakdown | null>(
    (currentLeader, executiveSlug) => {
      const count = executiveCounts.get(executiveSlug) ?? 0;

      if (!currentLeader || count > currentLeader.count) {
        return {
          count,
          executiveName: executiveLabels[executiveSlug],
          executiveSlug,
          share: 0
        };
      }

      return currentLeader;
    },
    null
  );
}

function getHighestIntentAction(
  eventCounts: ReadonlyMap<InteractionEventType, number>
) {
  return actionEventTypes.reduce<{
    readonly eventType: InteractionEventType;
    readonly count: number;
  } | null>((currentLeader, eventType) => {
    const count = getEventCount(eventCounts, eventType);

    if (!currentLeader || count > currentLeader.count) {
      return {
        count,
        eventType
      };
    }

    return currentLeader;
  }, null);
}

function buildExecutiveBreakdown(
  executiveCounts: ReadonlyMap<ExecutiveSlug, number>,
  totalInteractions: number
): readonly DashboardExecutiveBreakdown[] {
  return executiveSlugs.map((executiveSlug) => {
    const count = executiveCounts.get(executiveSlug) ?? 0;

    return {
      count,
      executiveName: executiveLabels[executiveSlug],
      executiveSlug,
      share: totalInteractions > 0 ? count / totalInteractions : 0
    };
  });
}

function buildEventTypeBreakdown(
  eventCounts: ReadonlyMap<InteractionEventType, number>,
  totalInteractions: number
): readonly DashboardEventTypeBreakdown[] {
  return interactionEventTypes.map((eventType) => {
    const count = getEventCount(eventCounts, eventType);

    return {
      count,
      eventType,
      label: eventTypeLabels[eventType],
      share: totalInteractions > 0 ? count / totalInteractions : 0
    };
  });
}

function buildConversion(
  key: DashboardConversionSummary["key"],
  label: string,
  numeratorEventType: InteractionEventType,
  eventCounts: ReadonlyMap<InteractionEventType, number>
): DashboardConversionSummary {
  const numerator = getEventCount(eventCounts, numeratorEventType);
  const denominator = getEventCount(eventCounts, "card_view");
  const rate = denominator > 0 ? numerator / denominator : 0;

  return {
    denominator,
    denominatorEventType: "card_view",
    displayValue: denominator > 0 ? formatPercent(rate) : "Not enough data",
    key,
    label,
    numerator,
    numeratorEventType,
    rate
  };
}

function buildConversions(
  eventCounts: ReadonlyMap<InteractionEventType, number>
): readonly DashboardConversionSummary[] {
  return [
    buildConversion(
      "vcard_conversion",
      "vCard conversion",
      "vcard_download",
      eventCounts
    ),
    buildConversion("call_conversion", "Call conversion", "call_click", eventCounts),
    buildConversion(
      "email_conversion",
      "Email conversion",
      "email_click",
      eventCounts
    ),
    buildConversion(
      "website_conversion",
      "Website conversion",
      "website_click",
      eventCounts
    )
  ];
}

export function buildDashboardData(
  source: DashboardSourceData
): ExecutiveInteractionDashboardData {
  const totalInteractions = interactionEventTypes.reduce(
    (total, eventType) => total + getEventCount(source.eventCounts, eventType),
    0
  );
  const mostActiveExecutive = getMostActiveExecutive(source.executiveCounts);
  const highestIntentAction = getHighestIntentAction(source.eventCounts);
  const cardViews = getEventCount(source.eventCounts, "card_view");
  const vCardDownloads = getEventCount(source.eventCounts, "vcard_download");
  const callClicks = getEventCount(source.eventCounts, "call_click");
  const emailClicks = getEventCount(source.eventCounts, "email_click");
  const websiteClicks = getEventCount(source.eventCounts, "website_click");
  const metrics: readonly DashboardMetric[] = [
    buildMetric(
      "total_interactions",
      "Total interactions",
      formatInteger(totalInteractions),
      "All recorded card and action events"
    ),
    buildMetric(
      "card_views",
      "Card views",
      formatInteger(cardViews),
      "Route loads recorded as card_view"
    ),
    buildMetric(
      "vcard_downloads",
      "vCard downloads",
      formatInteger(vCardDownloads),
      "Contact export clicks"
    ),
    buildMetric(
      "call_clicks",
      "Call clicks",
      formatInteger(callClicks),
      "Phone intent actions"
    ),
    buildMetric(
      "email_clicks",
      "Email clicks",
      formatInteger(emailClicks),
      "Email intent actions"
    ),
    buildMetric(
      "website_clicks",
      "Website clicks",
      formatInteger(websiteClicks),
      "Website visits from card actions"
    ),
    buildMetric(
      "most_active_executive",
      "Most active executive",
      mostActiveExecutive && mostActiveExecutive.count > 0
        ? mostActiveExecutive.executiveName
        : "Not enough data",
      mostActiveExecutive && mostActiveExecutive.count > 0
        ? `${formatInteger(mostActiveExecutive.count)} recorded interactions`
        : "No executive has recorded activity yet"
    ),
    buildMetric(
      "highest_intent_action",
      "Highest intent action",
      highestIntentAction && highestIntentAction.count > 0
        ? eventTypeLabels[highestIntentAction.eventType]
        : "Not enough data",
      highestIntentAction && highestIntentAction.count > 0
        ? `${formatInteger(highestIntentAction.count)} action events`
        : "No action clicks have been recorded yet"
    )
  ];

  return {
    conversions: buildConversions(source.eventCounts),
    dailyCounts: source.dailyCounts,
    eventTypeBreakdown: buildEventTypeBreakdown(
      source.eventCounts,
      totalInteractions
    ),
    executiveBreakdown: buildExecutiveBreakdown(
      source.executiveCounts,
      totalInteractions
    ),
    generatedAt: new Date().toISOString(),
    metrics,
    recentInteractions: source.recentInteractions,
    status: source.status,
    statusMessage: source.statusMessage,
    totalInteractions,
    topIntentSignals: [],
    intentTierBreakdown: [],
    executiveIntentSummary: []
  };
}

export function createEmptyDashboardData(
  status: DashboardStatus,
  statusMessage: string
): ExecutiveInteractionDashboardData {
  return buildDashboardData({
    dailyCounts: [],
    eventCounts: new Map(),
    executiveCounts: new Map(),
    recentInteractions: [],
    status,
    statusMessage
  });
}
