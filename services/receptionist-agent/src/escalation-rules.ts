import type {
  ReceptionistEscalationRecommendation,
  ReceptionistIntentCategory,
  ReceptionistPriority,
  ReceptionistSentiment,
  ReceptionistTaskDraft
} from "@bidayax/types";

export function evaluateEscalation({
  intent,
  priority,
  sentiment,
  tasks
}: {
  readonly intent: ReceptionistIntentCategory;
  readonly priority: ReceptionistPriority;
  readonly sentiment: ReceptionistSentiment;
  readonly tasks: readonly ReceptionistTaskDraft[];
}): ReceptionistEscalationRecommendation {
  const reasons = new Set<string>();

  if (intent === "investor_interest") {
    reasons.add("INVESTOR_INTEREST");
  }

  if (intent === "urgent_executive_attention") {
    reasons.add("URGENT_EXECUTIVE_ATTENTION");
  }

  if (intent === "partnership_interest" && priority === "high") {
    reasons.add("HIGH_PRIORITY_PARTNERSHIP");
  }

  if (sentiment === "negative" && (priority === "high" || priority === "urgent")) {
    reasons.add("NEGATIVE_HIGH_PRIORITY");
  }

  if (tasks.some((task) => task.taskType === "escalate_to_executive")) {
    reasons.add("EXECUTIVE_APPROVAL_REQUIRED");
  }

  if (intent === "unknown") {
    reasons.add("LOW_CLASSIFICATION_CONFIDENCE");
  }

  const shouldEscalate = reasons.size > 0;

  return {
    reasonCodes: Array.from(reasons).sort(),
    recommendation: shouldEscalate
      ? "Simulated escalation recommended for human review. No executive is contacted automatically."
      : "No simulated escalation recommended. Keep the task in review.",
    shouldEscalate
  };
}
