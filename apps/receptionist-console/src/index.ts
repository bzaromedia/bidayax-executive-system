import type { ReceptionistInteraction, ReceptionistTask } from "@bidayax/types";

export type ReceptionistConsoleSnapshot = {
  readonly interactions: readonly ReceptionistInteraction[];
  readonly tasks: readonly ReceptionistTask[];
  readonly approvalQueueCount: number;
};

export function summarizeReceptionistConsole(input: ReceptionistConsoleSnapshot) {
  return {
    activeInteractions: input.interactions.filter((interaction) =>
      ["received", "processing", "callback_queued", "scheduled"].includes(interaction.status)
    ).length,
    approvalQueueCount: input.approvalQueueCount,
    completedInteractions: input.interactions.filter((interaction) => interaction.status === "completed").length,
    queuedTasks: input.tasks.filter((task) => task.status === "queued").length
  };
}
