import type {
  ContactGraphNode,
  ContactGraphNodeType,
  ExecutiveSlug
} from "@bidayax/types";

export const graphNodeTypes = {
  executive: "executive",
  interactionEvent: "interaction_event",
  intentScore: "intent_score",
  session: "session",
  visitor: "visitor"
} as const satisfies Record<string, ContactGraphNodeType>;

export function visitorStableKey(anonymousVisitorId: string) {
  return `visitor:${anonymousVisitorId}`;
}

export function sessionStableKey(sessionId: string) {
  return `session:${sessionId}`;
}

export function executiveStableKey(executiveSlug: ExecutiveSlug) {
  return `executive:${executiveSlug}`;
}

export function interactionEventStableKey(eventId: string) {
  return `interaction_event:${eventId}`;
}

export function intentScoreStableKey(intentScoreId: string) {
  return `intent_score:${intentScoreId}`;
}

export function createNode(
  node: Omit<ContactGraphNode, "createdAt" | "id" | "updatedAt">
): ContactGraphNode {
  return node;
}
