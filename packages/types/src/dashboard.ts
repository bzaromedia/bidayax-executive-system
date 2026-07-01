import type { ExecutiveSlug, InteractionEventType } from "./events";
import type { ContactGraphEdgeType } from "./graph";
import type { IntentReasonCode, IntentScoringVersion, IntentTier } from "./intent";
import type {
  LiveVoiceSafetyReasonCode,
  ProviderReadinessCheck,
  VoiceRuntimeReadinessResult
} from "./live-provider";
import type {
  ImprovementApprovalStatus,
  ImprovementCandidateStatus,
  ImprovementEngineSummary,
  ImprovementOpportunityStatus,
  ImprovementOpportunityType,
  ImprovementSeverity,
  ImprovementSubsystem
} from "./improvement";
import type {
  TelemetrySafetyGateDecision,
  TelemetrySeverity,
  TelemetryStatus,
  TelemetrySubsystem
} from "./telemetry";
import type {
  ReceptionistChannel,
  ReceptionistIntentCategory,
  ReceptionistInteractionType,
  ReceptionistPriority,
  ReceptionistTaskStatus,
  ReceptionistTaskType
} from "./receptionist";
import type {
  OutboundCallApprovalStatus,
  OutboundCallRequestStatus,
  TelephonyCallDirection,
  TelephonyCallEventType,
  TelephonyCallStatus,
  TelephonyProviderName,
  VoiceSessionStatus
} from "./telephony";
export type DashboardStatus = "ready" | "not_configured" | "query_failed";

export type DashboardMetricKey =
  | "total_interactions"
  | "card_views"
  | "vcard_downloads"
  | "call_clicks"
  | "email_clicks"
  | "website_clicks"
  | "share_clicks"
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
    | "website_conversion"
    | "share_conversion";
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

export type DashboardContactGraphSummary = {
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly snapshotCount: number;
  readonly visitorCount: number;
  readonly sessionCount: number;
  readonly executiveCount: number;
  readonly highestIntentScore: number | null;
};

export type DashboardRelationshipSnapshot = {
  readonly id: string;
  readonly label: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly executiveName: string;
  readonly totalEvents: number;
  readonly highestIntentScore: number | null;
  readonly highestIntentTier: IntentTier | null;
  readonly engagementSummary: string;
  readonly lastActivityAt: string | null;
};

export type DashboardEngagementPath = {
  readonly id: string;
  readonly edgeType: ContactGraphEdgeType;
  readonly sourceLabel: string;
  readonly targetLabel: string;
  readonly weight: number;
  readonly createdAt: string | null;
};

export type DashboardReceptionistSummary = {
  readonly interactionCount: number;
  readonly simulatedCount: number;
  readonly taskCount: number;
  readonly escalationCount: number;
  readonly languageCount: number;
};

export type DashboardReceptionistInteraction = {
  readonly id: string;
  readonly interactionType: ReceptionistInteractionType;
  readonly channel: ReceptionistChannel;
  readonly status: string;
  readonly language: string;
  readonly dialect: string | null;
  readonly executiveSlug: ExecutiveSlug;
  readonly executiveName: string;
  readonly summary: string;
  readonly priority: ReceptionistPriority;
  readonly createdAt: string;
};

export type DashboardReceptionistTask = {
  readonly id: string;
  readonly taskType: ReceptionistTaskType;
  readonly status: ReceptionistTaskStatus;
  readonly priority: ReceptionistPriority;
  readonly assignedTo: string | null;
  readonly dueAt: string | null;
  readonly description: string;
  readonly createdAt: string;
};

export type DashboardReceptionistLanguageBreakdown = {
  readonly language: string;
  readonly count: number;
  readonly share: number;
};

export type DashboardReceptionistIntentBreakdown = {
  readonly intent: ReceptionistIntentCategory;
  readonly count: number;
};

export type DashboardTelephonyReadinessSummary = {
  readonly provider: TelephonyProviderName;
  readonly providerConfigured: boolean;
  readonly outboundCallsEnabled: boolean;
  readonly voiceAgentEnabled: boolean;
  readonly requireHumanApproval: boolean;
  readonly callCount: number;
  readonly voiceSessionCount: number;
  readonly pendingApprovalCount: number;
};

export type DashboardTelephonyCallEvent = {
  readonly id: string;
  readonly eventType: TelephonyCallEventType;
  readonly provider: TelephonyProviderName;
  readonly direction: TelephonyCallDirection;
  readonly status: TelephonyCallStatus;
  readonly executiveSlug: ExecutiveSlug;
  readonly executiveName: string;
  readonly maskedFromNumber: string | null;
  readonly maskedToNumber: string | null;
  readonly createdAt: string;
};

export type DashboardVoiceSession = {
  readonly id: string;
  readonly provider: TelephonyProviderName;
  readonly voiceModel: string;
  readonly status: VoiceSessionStatus;
  readonly transcriptStatus: string;
  readonly summaryStatus: string;
  readonly language: string | null;
  readonly createdAt: string;
};

export type DashboardOutboundCallApproval = {
  readonly id: string;
  readonly requestedBy: string;
  readonly maskedToNumber: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly executiveName: string;
  readonly reason: string;
  readonly approvalStatus: OutboundCallApprovalStatus;
  readonly status: OutboundCallRequestStatus;
  readonly createdAt: string;
};

export type DashboardLiveProviderSummary = {
  readonly providerMode: "mock" | "twilio";
  readonly twilioConfigured: boolean;
  readonly openAiRealtimeConfigured: boolean;
  readonly voiceAgentEnabled: boolean;
  readonly voiceRuntimeProvider: "none" | "openai_realtime";
  readonly voiceTestMode: boolean;
  readonly liveInboundCallsEnabled: boolean;
  readonly outboundCallsEnabled: boolean;
  readonly requireHumanApproval: boolean;
  readonly allowProductionCalls: boolean;
  readonly productionVoiceAllowed: boolean;
  readonly lastCheckedAt: string;
  readonly blockedReasonCodes: readonly LiveVoiceSafetyReasonCode[];
};

export type DashboardLiveProviderReadinessData = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
  readonly summary: DashboardLiveProviderSummary;
  readonly readinessChecks: readonly ProviderReadinessCheck[];
  readonly voiceRuntime: VoiceRuntimeReadinessResult;
};

export type DashboardObservabilitySummary = {
  readonly eventCount: number;
  readonly metricCount: number;
  readonly errorCount: number;
  readonly safetyGateEventCount: number;
  readonly blockedSafetyGateCount: number;
  readonly subsystemCount: number;
};

export type DashboardTelemetryEvent = {
  readonly id: string;
  readonly eventName: string;
  readonly subsystem: TelemetrySubsystem;
  readonly severity: TelemetrySeverity;
  readonly status: TelemetryStatus;
  readonly durationMs: number | null;
  readonly correlationId: string | null;
  readonly createdAt: string;
};

export type DashboardTelemetryMetric = {
  readonly metricName: string;
  readonly subsystem: TelemetrySubsystem;
  readonly value: number;
  readonly unit: string;
};

export type DashboardTelemetryError = {
  readonly id: string;
  readonly subsystem: TelemetrySubsystem;
  readonly errorCode: string;
  readonly errorCategory: string;
  readonly severity: TelemetrySeverity;
  readonly safeMessage: string;
  readonly createdAt: string;
};

export type DashboardTelemetrySafetyGate = {
  readonly id: string;
  readonly gateName: string;
  readonly subsystem: TelemetrySubsystem;
  readonly decision: TelemetrySafetyGateDecision;
  readonly reasonCodes: readonly string[];
  readonly createdAt: string;
};

export type DashboardSubsystemHealth = {
  readonly subsystem: TelemetrySubsystem;
  readonly eventCount: number;
  readonly errorCount: number;
  readonly blockedSafetyGateCount: number;
  readonly status: "healthy" | "degraded" | "attention";
};

export type DashboardObservabilityData = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
  readonly summary: DashboardObservabilitySummary;
  readonly events: readonly DashboardTelemetryEvent[];
  readonly metrics: readonly DashboardTelemetryMetric[];
  readonly errors: readonly DashboardTelemetryError[];
  readonly safetyGateEvents: readonly DashboardTelemetrySafetyGate[];
  readonly subsystemHealth: readonly DashboardSubsystemHealth[];
};

export type DashboardImprovementOpportunity = {
  readonly id: string;
  readonly subsystem: ImprovementSubsystem;
  readonly opportunityType: ImprovementOpportunityType;
  readonly evidenceSummary: string;
  readonly sourceMetric: string;
  readonly baselineValue: number;
  readonly severity: ImprovementSeverity;
  readonly status: ImprovementOpportunityStatus;
  readonly createdAt: string;
};

export type DashboardImprovementCandidate = {
  readonly id: string;
  readonly opportunityId: string | null;
  readonly title: string;
  readonly hypothesis: string;
  readonly targetSubsystem: ImprovementSubsystem;
  readonly proposedChangeSummary: string;
  readonly expectedMetric: string;
  readonly expectedImpact: number;
  readonly riskScore: number;
  readonly evidenceScore: number;
  readonly complexityScore: number;
  readonly priorityScore: number;
  readonly status: ImprovementCandidateStatus;
  readonly createdAt: string;
};

export type DashboardImprovementLineage = {
  readonly id: string;
  readonly candidateId: string | null;
  readonly variantId: string;
  readonly targetArea: ImprovementSubsystem;
  readonly hypothesis: string;
  readonly riskScore: number;
  readonly approvalStatus: ImprovementApprovalStatus;
  readonly rollbackPlan: string;
  readonly metricsAfterIsEmpty: boolean;
  readonly createdAt: string;
};

export type DashboardImprovementApproval = {
  readonly id: string;
  readonly candidateId: string;
  readonly decision: string;
  readonly decidedBy: string;
  readonly decisionNotes: string;
  readonly createdAt: string;
};

export type DashboardImprovementEngineData = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
  readonly summary: ImprovementEngineSummary;
  readonly opportunities: readonly DashboardImprovementOpportunity[];
  readonly candidates: readonly DashboardImprovementCandidate[];
  readonly lineage: readonly DashboardImprovementLineage[];
  readonly approvals: readonly DashboardImprovementApproval[];
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
