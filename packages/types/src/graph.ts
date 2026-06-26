import type { ExecutiveSlug, InteractionEventType } from "./events";
import type { IntentScoringVersion, IntentTier } from "./intent";

export const contactGraphNodeTypes = [
  "visitor",
  "session",
  "executive",
  "interaction_event",
  "intent_score"
] as const;

export type ContactGraphNodeType = (typeof contactGraphNodeTypes)[number];

export const contactGraphEdgeTypes = [
  "visitor_has_session",
  "session_viewed_executive",
  "session_generated_event",
  "event_targets_executive",
  "session_has_intent_score",
  "visitor_engaged_executive"
] as const;

export type ContactGraphEdgeType = (typeof contactGraphEdgeTypes)[number];

export type ContactGraphMetadataValue =
  | string
  | number
  | boolean
  | null
  | readonly string[];

export type ContactGraphMetadata = Record<string, ContactGraphMetadataValue>;

export type ContactGraphNode = {
  readonly id?: string;
  readonly nodeType: ContactGraphNodeType;
  readonly stableKey: string;
  readonly label: string;
  readonly metadata: ContactGraphMetadata;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export type ContactGraphEdge = {
  readonly id?: string;
  readonly edgeType: ContactGraphEdgeType;
  readonly sourceStableKey: string;
  readonly targetStableKey: string;
  readonly sourceNodeId?: string;
  readonly targetNodeId?: string;
  readonly weight: number;
  readonly metadata: ContactGraphMetadata;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export type ContactGraphSnapshot = {
  readonly id?: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly anonymousVisitorId: string;
  readonly sessionId: string;
  readonly totalEvents: number;
  readonly highestIntentScore: number | null;
  readonly highestIntentTier: IntentTier | null;
  readonly engagementSummary: string;
  readonly lastActivityAt: string | null;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export type ContactGraphInteractionEvent = {
  readonly id: string;
  readonly eventType: InteractionEventType;
  readonly executiveSlug: ExecutiveSlug;
  readonly anonymousVisitorId: string;
  readonly sessionId: string;
  readonly sourceUrl: string | null;
  readonly referrer: string | null;
  readonly deviceType: string | null;
  readonly browser: string | null;
  readonly os: string | null;
  readonly createdAt: string;
};

export type ContactGraphIntentScore = {
  readonly id: string;
  readonly anonymousVisitorId: string;
  readonly sessionId: string;
  readonly executiveSlug: ExecutiveSlug;
  readonly score: number;
  readonly tier: IntentTier;
  readonly reasonCodes: readonly string[];
  readonly scoringVersion: IntentScoringVersion;
  readonly eventCount: number;
  readonly firstEventAt: string | null;
  readonly lastEventAt: string | null;
};

export type ContactGraphBuildResult = {
  readonly nodes: readonly ContactGraphNode[];
  readonly edges: readonly ContactGraphEdge[];
  readonly snapshots: readonly ContactGraphSnapshot[];
  readonly duplicateNodesSkipped: number;
  readonly duplicateEdgesSkipped: number;
};

export function isContactGraphNodeType(
  value: string
): value is ContactGraphNodeType {
  return (contactGraphNodeTypes as readonly string[]).includes(value);
}

export function isContactGraphEdgeType(
  value: string
): value is ContactGraphEdgeType {
  return (contactGraphEdgeTypes as readonly string[]).includes(value);
}
