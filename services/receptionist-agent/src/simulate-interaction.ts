import type {
  SimulateReceptionistInteractionInput,
  SimulateReceptionistInteractionResult
} from "@bidayax/types";
import { evaluateEscalation } from "./escalation-rules";
import { createLanguageProfile } from "./language-profile";
import {
  classifyReceptionistIntent,
  classifyReceptionistSentiment,
  getPriorityForIntent
} from "./receptionist-intents";
import {
  createWorkflowEvents,
  summarizeSimulatedInteraction
} from "./receptionist-workflow";
import { generateReceptionistTasks } from "./task-generator";

function logReceptionistEvent(
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console.info(
    JSON.stringify({
      component: "polyglot-receptionist-os-foundation",
      event,
      ...details
    })
  );
}

export function simulateReceptionistInteraction(
  input: SimulateReceptionistInteractionInput
): SimulateReceptionistInteractionResult {
  if (!input.text.trim()) {
    logReceptionistEvent("validation_failure", {
      reason: "empty_text"
    });
  }

  const languageProfile = createLanguageProfile({
    dialect: input.dialect ?? null,
    language: input.language
  });
  const classifiedIntent = classifyReceptionistIntent(input.text);
  const sentiment = classifyReceptionistSentiment(input.text);
  const priority = getPriorityForIntent({
    intent: classifiedIntent,
    sentiment
  });
  const tasks = generateReceptionistTasks({
    intent: classifiedIntent,
    priority
  });
  const escalation = evaluateEscalation({
    intent: classifiedIntent,
    priority,
    sentiment,
    tasks
  });
  const summary = summarizeSimulatedInteraction({
    intent: classifiedIntent,
    tasks
  });
  const workflowEvents = createWorkflowEvents({
    escalationRecommended: escalation.shouldEscalate,
    intent: classifiedIntent,
    languageProfile,
    taskCount: tasks.length
  });

  logReceptionistEvent("simulated_interaction_created", {
    channel: input.channel,
    interactionType: input.interactionType
  });
  logReceptionistEvent("language_profile_assigned", {
    language: languageProfile.language
  });
  logReceptionistEvent("intent_classified", {
    intent: classifiedIntent
  });
  logReceptionistEvent("task_generated", {
    taskCount: tasks.length
  });

  if (escalation.shouldEscalate) {
    logReceptionistEvent("escalation_recommended", {
      reasonCount: escalation.reasonCodes.length
    });
  }

  logReceptionistEvent("workflow_completed", {
    workflowEventCount: workflowEvents.length
  });

  return {
    channel: input.channel,
    classifiedIntent,
    conversationTurns: [
      {
        language: languageProfile.language,
        sequenceNumber: 1,
        speaker: "visitor",
        text: input.text
      },
      {
        language: languageProfile.language,
        sequenceNumber: 2,
        speaker: "system",
        text: summary
      }
    ],
    escalation,
    executiveSlug: input.executiveSlug,
    interactionType: input.interactionType,
    languageProfile,
    priority,
    sentiment,
    status: "simulated",
    summary,
    tasks,
    workflowEvents
  };
}
