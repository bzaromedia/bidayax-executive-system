import type {
  ContactGraphBuildResult,
  ContactGraphEdge,
  ContactGraphInteractionEvent,
  ContactGraphIntentScore,
  ContactGraphNode,
  ExecutiveSlug
} from "@bidayax/types";
import { createTelemetryEvent, createTelemetryMetric } from "@bidayax/telemetry";
import { createEdge, edgeStableKey, graphEdgeTypes } from "./graph-edge-types";
import {
  createNode,
  executiveStableKey,
  interactionEventStableKey,
  intentScoreStableKey,
  sessionStableKey,
  visitorStableKey
} from "./graph-node-types";
import { createGraphSnapshot } from "./graph-snapshot";

export type BuildGraphFromEventsInput = {
  readonly events: readonly ContactGraphInteractionEvent[];
  readonly intentScores: readonly ContactGraphIntentScore[];
};

type SnapshotGroup = {
  readonly anonymousVisitorId: string;
  readonly sessionId: string;
  readonly executiveSlug: ExecutiveSlug;
};

function toTimestamp(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function groupKey(group: SnapshotGroup) {
  return [
    group.anonymousVisitorId,
    group.sessionId,
    group.executiveSlug
  ].join("::");
}

function addNode(
  nodes: Map<string, ContactGraphNode>,
  node: ContactGraphNode
) {
  const exists = nodes.has(node.stableKey);

  if (!exists) {
    nodes.set(node.stableKey, node);
  }

  return exists;
}

function addEdge(
  edges: Map<string, ContactGraphEdge>,
  edge: ContactGraphEdge
) {
  const key = edgeStableKey(edge);
  const exists = edges.has(key);

  if (!exists) {
    edges.set(key, edge);
  }

  return exists;
}

function visitorLabel(index: number) {
  return `Anonymous Visitor ${index}`;
}

function sessionLabel(index: number) {
  return `Anonymous Session ${index}`;
}

function addCoreNodes({
  anonymousVisitorId,
  duplicateCounts,
  executiveSlug,
  nodes,
  sessionId
}: SnapshotGroup & {
  readonly duplicateCounts: { duplicateNodesSkipped: number };
  readonly nodes: Map<string, ContactGraphNode>;
}) {
  const visitorKey = visitorStableKey(anonymousVisitorId);
  const sessionKey = sessionStableKey(sessionId);
  const executiveKey = executiveStableKey(executiveSlug);

  if (
    addNode(
      nodes,
      createNode({
        label: visitorLabel(
          Array.from(nodes.values()).filter((node) => node.nodeType === "visitor")
            .length + 1
        ),
        metadata: {
          anonymousVisitorId
        },
        nodeType: "visitor",
        stableKey: visitorKey
      })
    )
  ) {
    duplicateCounts.duplicateNodesSkipped += 1;
  }

  if (
    addNode(
      nodes,
      createNode({
        label: sessionLabel(
          Array.from(nodes.values()).filter((node) => node.nodeType === "session")
            .length + 1
        ),
        metadata: {
          sessionId
        },
        nodeType: "session",
        stableKey: sessionKey
      })
    )
  ) {
    duplicateCounts.duplicateNodesSkipped += 1;
  }

  if (
    addNode(
      nodes,
      createNode({
        label: `Executive ${executiveSlug}`,
        metadata: {
          executiveSlug
        },
        nodeType: "executive",
        stableKey: executiveKey
      })
    )
  ) {
    duplicateCounts.duplicateNodesSkipped += 1;
  }

  return {
    executiveKey,
    sessionKey,
    visitorKey
  };
}

function addCoreEdges({
  duplicateCounts,
  edges,
  executiveKey,
  sessionKey,
  visitorKey
}: {
  readonly duplicateCounts: { duplicateEdgesSkipped: number };
  readonly edges: Map<string, ContactGraphEdge>;
  readonly executiveKey: string;
  readonly sessionKey: string;
  readonly visitorKey: string;
}) {
  const coreEdges = [
    createEdge({
      edgeType: graphEdgeTypes.visitorHasSession,
      metadata: {},
      sourceStableKey: visitorKey,
      targetStableKey: sessionKey,
      weight: 1
    }),
    createEdge({
      edgeType: graphEdgeTypes.sessionViewedExecutive,
      metadata: {},
      sourceStableKey: sessionKey,
      targetStableKey: executiveKey,
      weight: 1
    }),
    createEdge({
      edgeType: graphEdgeTypes.visitorEngagedExecutive,
      metadata: {},
      sourceStableKey: visitorKey,
      targetStableKey: executiveKey,
      weight: 1
    })
  ];

  for (const edge of coreEdges) {
    if (addEdge(edges, edge)) {
      duplicateCounts.duplicateEdgesSkipped += 1;
    }
  }
}

function getLastActivityAt({
  events,
  score
}: {
  readonly events: readonly ContactGraphInteractionEvent[];
  readonly score: ContactGraphIntentScore | null;
}) {
  const eventLastActivity = events
    .map((event) => event.createdAt)
    .sort((left, right) => toTimestamp(right) - toTimestamp(left))[0];
  const scoreLastActivity = score?.lastEventAt ?? null;
  const candidates = [eventLastActivity, scoreLastActivity].filter(
    (value): value is string => Boolean(value)
  );

  return candidates.sort((left, right) => toTimestamp(right) - toTimestamp(left))[0] ?? null;
}

export function buildGraphFromEvents({
  events,
  intentScores
}: BuildGraphFromEventsInput): ContactGraphBuildResult {
  const startedAt = Date.now();
  const nodes = new Map<string, ContactGraphNode>();
  const edges = new Map<string, ContactGraphEdge>();
  const duplicateCounts = {
    duplicateEdgesSkipped: 0,
    duplicateNodesSkipped: 0
  };
  const groupedEvents = new Map<string, ContactGraphInteractionEvent[]>();
  const groupedScores = new Map<string, ContactGraphIntentScore[]>();

  for (const event of events) {
    const keys = addCoreNodes({
      anonymousVisitorId: event.anonymousVisitorId,
      duplicateCounts,
      executiveSlug: event.executiveSlug,
      nodes,
      sessionId: event.sessionId
    });
    const eventKey = interactionEventStableKey(event.id);

    addCoreEdges({
      duplicateCounts,
      edges,
      ...keys
    });

    if (
      addNode(
        nodes,
        createNode({
          label: `Interaction ${event.eventType}`,
          metadata: {
            eventId: event.id,
            eventType: event.eventType,
            sourceUrl: event.sourceUrl
          },
          nodeType: "interaction_event",
          stableKey: eventKey
        })
      )
    ) {
      duplicateCounts.duplicateNodesSkipped += 1;
    }

    for (const edge of [
      createEdge({
        edgeType: graphEdgeTypes.sessionGeneratedEvent,
        metadata: {
          eventType: event.eventType
        },
        sourceStableKey: keys.sessionKey,
        targetStableKey: eventKey,
        weight: 1
      }),
      createEdge({
        edgeType: graphEdgeTypes.eventTargetsExecutive,
        metadata: {
          eventType: event.eventType
        },
        sourceStableKey: eventKey,
        targetStableKey: keys.executiveKey,
        weight: 1
      })
    ]) {
      if (addEdge(edges, edge)) {
        duplicateCounts.duplicateEdgesSkipped += 1;
      }
    }

    const existingGroup = groupedEvents.get(groupKey(event));
    if (existingGroup) {
      existingGroup.push(event);
    } else {
      groupedEvents.set(groupKey(event), [event]);
    }
  }

  for (const score of intentScores) {
    const keys = addCoreNodes({
      anonymousVisitorId: score.anonymousVisitorId,
      duplicateCounts,
      executiveSlug: score.executiveSlug,
      nodes,
      sessionId: score.sessionId
    });
    const scoreKey = intentScoreStableKey(score.id);

    addCoreEdges({
      duplicateCounts,
      edges,
      ...keys
    });

    if (
      addNode(
        nodes,
        createNode({
          label: `Intent score ${score.score}`,
          metadata: {
            eventCount: score.eventCount,
            reasonCodes: score.reasonCodes,
            score: score.score,
            scoringVersion: score.scoringVersion,
            tier: score.tier
          },
          nodeType: "intent_score",
          stableKey: scoreKey
        })
      )
    ) {
      duplicateCounts.duplicateNodesSkipped += 1;
    }

    if (
      addEdge(
        edges,
        createEdge({
          edgeType: graphEdgeTypes.sessionHasIntentScore,
          metadata: {
            score: score.score,
            tier: score.tier
          },
          sourceStableKey: keys.sessionKey,
          targetStableKey: scoreKey,
          weight: Math.max(1, score.score)
        })
      )
    ) {
      duplicateCounts.duplicateEdgesSkipped += 1;
    }

    const existingGroup = groupedScores.get(groupKey(score));
    if (existingGroup) {
      existingGroup.push(score);
    } else {
      groupedScores.set(groupKey(score), [score]);
    }
  }

  const snapshotKeys = new Set([...groupedEvents.keys(), ...groupedScores.keys()]);
  const snapshots = Array.from(snapshotKeys)
    .sort()
    .map((key) => {
      const [anonymousVisitorId = "", sessionId = "", executiveSlug = "ad-garner"] =
        key.split("::") as [string, string, ExecutiveSlug];
      const eventsForSnapshot = groupedEvents.get(key) ?? [];
      const scoresForSnapshot = groupedScores.get(key) ?? [];
      const highestScore =
        scoresForSnapshot
          .slice()
          .sort((left, right) => right.score - left.score)[0] ?? null;

      return createGraphSnapshot({
        anonymousVisitorId,
        events: eventsForSnapshot,
        executiveSlug,
        highestIntentScore: highestScore?.score ?? null,
        highestIntentTier: highestScore?.tier ?? null,
        lastActivityAt: getLastActivityAt({
          events: eventsForSnapshot,
          score: highestScore
        }),
        sessionId
      });
    });

  const result = {
    duplicateEdgesSkipped: duplicateCounts.duplicateEdgesSkipped,
    duplicateNodesSkipped: duplicateCounts.duplicateNodesSkipped,
    edges: Array.from(edges.values()).sort((left, right) =>
      edgeStableKey(left).localeCompare(edgeStableKey(right))
    ),
    nodes: Array.from(nodes.values()).sort((left, right) =>
      left.stableKey.localeCompare(right.stableKey)
    ),
    snapshots
  };

  console.info(
    JSON.stringify({
      component: "contact-graph-telemetry",
      event: createTelemetryEvent({
        durationMs: Math.round(Date.now() - startedAt),
        eventName: "contact_graph_built",
        metadata: {
          edgeCount: result.edges.length,
          nodeCount: result.nodes.length,
          snapshotCount: result.snapshots.length
        },
        status: "success",
        subsystem: "contact_graph"
      }),
      metric: createTelemetryMetric({
        metricName: "graph_build_duration_ms",
        metricUnit: "milliseconds",
        metricValue: Math.round(Date.now() - startedAt),
        subsystem: "contact_graph"
      })
    })
  );

  return result;
}
