import type { ContactGraphEdgeType } from "@bidayax/types";

export const graphEdgeLabels = {
  event_targets_executive: "Event targets executive",
  session_generated_event: "Session generated event",
  session_has_intent_score: "Session has intent score",
  session_viewed_executive: "Session viewed executive",
  visitor_engaged_executive: "Visitor engaged executive",
  visitor_has_session: "Visitor has session"
} as const satisfies Record<ContactGraphEdgeType, string>;

export function formatGraphScore(value: number | null) {
  if (value === null) {
    return "No score";
  }

  return `${Math.round(value)} pts`;
}
