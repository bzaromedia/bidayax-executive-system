import type {
  CallIntent,
  ConversationMemory,
  ReceptionistInteraction,
  ReceptionistInteractionMode,
  ReceptionistPriority,
  ReceptionistProviderStatusValue,
  ReceptionistRequest,
  ReceptionistTask,
  ReceptionistWorkflowTriggerType,
  WorkflowNodeRun
} from "@bidayax/types";
import { executeWorkflow, type WorkflowNodeDefinition } from "@bidayax/workflow-engine";

export const frontOfficeWorkflowNodeIds = [
  "InboundCallTrigger",
  "ChatMessageTrigger",
  "VoiceChatTrigger",
  "FormSubmitTrigger",
  "ExecutiveLookup",
  "CallerLookup",
  "LanguageDetection",
  "ConsentDisclosure",
  "IntentClassification",
  "UrgencyScoring",
  "VoiceTrustScoring",
  "AvailabilityPolicy",
  "CalendarLookup",
  "CallbackScheduler",
  "AppointmentScheduler",
  "MessageCapture",
  "LeadQualification",
  "CallTransfer",
  "SpamFilter",
  "HumanApproval",
  "EventLedgerWrite",
  "ContactGraphUpdate",
  "NotificationSend",
  "ReceptionistSummary"
] as const;

export type FrontOfficeWorkflowNodeId =
  (typeof frontOfficeWorkflowNodeIds)[number];

export type ReceptionistFrontOfficeContext = {
  readonly request: ReceptionistRequest;
  readonly mode: ReceptionistInteractionMode;
  readonly triggerType: ReceptionistWorkflowTriggerType;
  readonly createdAt: string;
  readonly providerStatus: ReceptionistProviderStatusValue;
  readonly interaction?: ReceptionistInteraction;
  readonly task?: ReceptionistTask;
};

export function mapModeToTriggerType(
  mode: ReceptionistInteractionMode
): ReceptionistWorkflowTriggerType {
  const mapping: Record<ReceptionistInteractionMode, ReceptionistWorkflowTriggerType> = {
    chat: "chat",
    form: "form_submit",
    phone: "inbound_call",
    voice_chat: "voice_chat"
  };

  return mapping[mode];
}

export function mapModeToWorkflowSource(mode: ReceptionistInteractionMode) {
  const mapping = {
    chat: "chat_message",
    form: "web_form",
    phone: "inbound_call",
    voice_chat: "voice_chat"
  } as const;

  return mapping[mode];
}

function requestTypeToIntent(
  requestType: ReceptionistRequest["requestType"]
): CallIntent | ReceptionistRequest["requestType"] {
  const mapping = {
    general_inquiry: "unknown",
    partnership_request: "partner",
    qualify_lead: "sales",
    request_callback: "customer",
    route_message: "unknown",
    schedule_meeting: "customer",
    support_request: "customer"
  } as const;

  return mapping[requestType];
}

function requestTypeToAction(requestType: ReceptionistRequest["requestType"]) {
  const mapping = {
    general_inquiry: "take_message",
    partnership_request: "request_human_approval",
    qualify_lead: "qualify_lead",
    request_callback: "request_callback",
    route_message: "take_message",
    schedule_meeting: "book_meeting",
    support_request: "take_message"
  } as const;

  return mapping[requestType];
}

function requestTypeToTask(
  requestType: ReceptionistRequest["requestType"]
): ReceptionistTask["taskType"] {
  const mapping = {
    general_inquiry: "message",
    partnership_request: "review_transcript",
    qualify_lead: "qualify_lead",
    request_callback: "callback",
    route_message: "message",
    schedule_meeting: "appointment",
    support_request: "message"
  } as const;

  return mapping[requestType];
}

function scoreUrgency(requestType: ReceptionistRequest["requestType"]): number {
  if (requestType === "partnership_request" || requestType === "qualify_lead") {
    return 72;
  }

  if (requestType === "request_callback" || requestType === "schedule_meeting") {
    return 58;
  }

  return 36;
}

function priorityFromUrgency(score: number): ReceptionistPriority {
  if (score >= 75) {
    return "urgent";
  }

  if (score >= 60) {
    return "high";
  }

  if (score >= 40) {
    return "medium";
  }

  return "low";
}

export function extractConversationMemory(request: ReceptionistRequest): ConversationMemory {
  const urgencyScore = scoreUrgency(request.requestType);

  return {
    actionItems: [requestTypeToAction(request.requestType)],
    callerName: request.name,
    company: request.company ?? null,
    followUpRequired: true,
    intent: requestTypeToIntent(request.requestType),
    language: request.preferredLanguage,
    requestedTime: request.preferredTime ?? null,
    summary: `${request.name} submitted a ${request.requestType.replaceAll("_", " ")} request.`,
    urgency: priorityFromUrgency(urgencyScore)
  };
}

export function createReceptionistInteraction(input: {
  readonly request: ReceptionistRequest;
  readonly mode: ReceptionistInteractionMode;
  readonly now?: Date;
}): ReceptionistInteraction {
  const now = input.now ?? new Date();
  const urgencyScore = scoreUrgency(input.request.requestType);
  const action = requestTypeToAction(input.request.requestType);

  return {
    action,
    cardId: input.request.executiveSlug,
    createdAt: now.toISOString(),
    executiveId: input.request.executiveSlug,
    id: `receptionist-interaction-${now.getTime()}`,
    intent: input.request.requestType,
    language: input.request.preferredLanguage,
    mode: input.mode,
    status: input.request.requestType === "request_callback" ? "callback_queued" : "received",
    transcript: input.request.message,
    translatedSummary: extractConversationMemory(input.request).summary,
    trustScore: input.request.company ? 64 : 42,
    urgencyScore,
    visitorId: input.request.email.toLowerCase(),
    ...(input.request.dialect ? { dialect: input.request.dialect } : {}),
    ...(input.request.phone ? { callerPhone: input.request.phone } : {})
  };
}

export async function createFrontOfficeWorkflowRun(input: {
  readonly request: ReceptionistRequest;
  readonly mode: ReceptionistInteractionMode;
  readonly providerStatus?: ReceptionistProviderStatusValue;
  readonly now?: Date;
}) {
  const now = input.now ?? new Date();
  const providerStatus = input.providerStatus ?? "provider_unconfigured";
  const context: ReceptionistFrontOfficeContext = {
    createdAt: now.toISOString(),
    mode: input.mode,
    providerStatus,
    request: input.request,
    triggerType: mapModeToTriggerType(input.mode)
  };
  const nodes: WorkflowNodeDefinition<ReceptionistFrontOfficeContext>[] = frontOfficeWorkflowNodeIds.map((id) => ({
    id,
    label: id,
    requiresHumanApproval: id === "HumanApproval" && input.request.requestType === "partnership_request",
    run: (currentContext) => {
      if (id === "ReceptionistSummary") {
        const interaction = createReceptionistInteraction({
          mode: input.mode,
          now,
          request: input.request
        });
        const task: ReceptionistTask = {
          dueAt: input.request.preferredTime ?? null,
          interactionId: interaction.id,
          status: interaction.status === "blocked" ? "blocked" : "queued",
          summary: extractConversationMemory(input.request).summary,
          taskId: `receptionist-task-${now.getTime()}`,
          taskType: requestTypeToTask(input.request.requestType)
        };

        return {
          ...currentContext,
          interaction,
          task
        };
      }

      return currentContext;
    }
  }));
  const result = await executeWorkflow({
    context,
    nodes,
    now: () => now
  });
  const interaction = result.context.interaction ?? createReceptionistInteraction({
    mode: input.mode,
    now,
    request: input.request
  });
  const workflowNodes: readonly WorkflowNodeRun[] = result.steps.map((step) => ({
    completedAt: step.completedAt,
    nodeId: step.nodeId,
    startedAt: step.startedAt,
    status: step.status === "requires_human_review" ? "requires_human_review" : providerStatus,
    summary: `${step.nodeId} completed.`
  }));

  return {
    auditTrail: workflowNodes.map((node) => ({
      actor: "system" as const,
      eventId: `audit-${node.nodeId}-${now.getTime()}`,
      eventType: node.nodeId,
      interactionId: interaction.id,
      payload: {
        providerStatus: node.status,
        triggerType: result.context.triggerType
      },
      timestamp: node.completedAt
    })),
    interaction,
    nodes: workflowNodes,
    providerStatus,
    task: result.context.task,
    triggerType: result.context.triggerType
  };
}
