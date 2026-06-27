import type {
  ReceptionistIntentCategory,
  ReceptionistLanguageProfile,
  ReceptionistTaskDraft,
  ReceptionistWorkflowEventDraft
} from "@bidayax/types";

export function createWorkflowEvents({
  escalationRecommended,
  intent,
  languageProfile,
  taskCount
}: {
  readonly escalationRecommended: boolean;
  readonly intent: ReceptionistIntentCategory;
  readonly languageProfile: ReceptionistLanguageProfile;
  readonly taskCount: number;
}): readonly ReceptionistWorkflowEventDraft[] {
  const events: ReceptionistWorkflowEventDraft[] = [
    {
      eventType: "interaction_created",
      payload: {
        simulated: true
      }
    },
    {
      eventType: "language_detected",
      payload: {
        confidence: languageProfile.confidence,
        language: languageProfile.language
      }
    },
    {
      eventType: "intent_classified",
      payload: {
        intent
      }
    },
    {
      eventType: "task_created",
      payload: {
        taskCount
      }
    }
  ];

  if (escalationRecommended) {
    events.push({
      eventType: "escalation_recommended",
      payload: {
        simulated: true
      }
    });
  }

  events.push(
    {
      eventType: "summary_generated",
      payload: {
        simulated: true
      }
    },
    {
      eventType: "workflow_completed",
      payload: {
        simulated: true
      }
    }
  );

  return events;
}

export function summarizeSimulatedInteraction({
  intent,
  tasks
}: {
  readonly intent: ReceptionistIntentCategory;
  readonly tasks: readonly ReceptionistTaskDraft[];
}) {
  const taskList = tasks.map((task) => task.taskType).join(", ");

  return `Simulated receptionist interaction classified as ${intent}. Generated task: ${taskList}. No live communication was sent.`;
}
