import type { ContactGraphEdge, ContactGraphEdgeType } from "@bidayax/types";

export const graphEdgeTypes = {
  eventTargetsExecutive: "event_targets_executive",
  sessionGeneratedEvent: "session_generated_event",
  sessionHasIntentScore: "session_has_intent_score",
  sessionViewedExecutive: "session_viewed_executive",
  visitorEngagedExecutive: "visitor_engaged_executive",
  visitorHasSession: "visitor_has_session"
} as const satisfies Record<string, ContactGraphEdgeType>;

export function createEdge(
  edge: Omit<ContactGraphEdge, "createdAt" | "id" | "sourceNodeId" | "targetNodeId" | "updatedAt">
): ContactGraphEdge {
  return edge;
}

export function edgeStableKey(edge: ContactGraphEdge) {
  return `${edge.edgeType}:${edge.sourceStableKey}->${edge.targetStableKey}`;
}
