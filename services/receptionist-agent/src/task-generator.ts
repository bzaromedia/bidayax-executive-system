import type {
  ReceptionistIntentCategory,
  ReceptionistPriority,
  ReceptionistTaskDraft,
  ReceptionistTaskType
} from "@bidayax/types";

const taskTypeByIntent = {
  general_inquiry: "create_follow_up",
  investor_interest: "escalate_to_executive",
  partnership_interest: "qualify_lead",
  request_callback: "return_call",
  schedule_meeting: "schedule_meeting",
  spam_or_low_value: "review_transcript",
  support_request: "review_transcript",
  unknown: "review_transcript",
  urgent_executive_attention: "escalate_to_executive",
  vendor_inquiry: "review_transcript",
  wrong_number: "review_transcript"
} as const satisfies Record<ReceptionistIntentCategory, ReceptionistTaskType>;

function taskDescription({
  intent,
  taskType
}: {
  readonly intent: ReceptionistIntentCategory;
  readonly taskType: ReceptionistTaskType;
}) {
  return `Simulated ${taskType} task generated from ${intent}. Human review is required before any live action.`;
}

export function generateReceptionistTasks({
  intent,
  priority
}: {
  readonly intent: ReceptionistIntentCategory;
  readonly priority: ReceptionistPriority;
}): readonly ReceptionistTaskDraft[] {
  const taskType = taskTypeByIntent[intent];

  return [
    {
      assignedTo: null,
      description: taskDescription({ intent, taskType }),
      dueAt: null,
      priority,
      status: "simulated",
      taskType
    }
  ];
}
