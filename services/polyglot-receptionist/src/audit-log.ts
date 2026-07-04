import type { ReceptionistRunStep } from "./workflow-nodes";

export function createReceptionistAuditEvent(step: ReceptionistRunStep) {
  return {
    eventType: step.stage,
    payload: {
      ...step.metadata,
      status: step.status,
      summary: step.summary
    }
  };
}
