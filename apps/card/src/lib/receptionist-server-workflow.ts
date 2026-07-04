import {
  runReceptionistWorkflow,
  type ReceptionistWorkflowSource
} from "@bidayax/polyglot-receptionist";
import { createCustomerCardSettingsFromExecutiveProfile } from "@bidayax/card-customization";
import { getExecutiveProfileBySlug } from "@bidayax/config/executives";
import type {
  ExecutiveSlug,
  ReceptionistNotificationPayload,
  ReceptionistRequest,
  ReceptionistStatus
} from "@bidayax/types";
import { storeReceptionistRequest } from "./receptionist-events";

type ProcessReceptionistWorkflowInput = {
  readonly anonymousVisitorId?: string | null;
  readonly executiveSlug: ExecutiveSlug;
  readonly rateLimitKey?: string;
  readonly request: ReceptionistRequest;
  readonly sessionId?: string | null;
  readonly source: ReceptionistWorkflowSource;
  readonly sourceUrl?: string | null;
};

export type ProcessReceptionistWorkflowResult = {
  readonly error?: string;
  readonly providerStatus: ReceptionistStatus;
  readonly requestId?: string;
  readonly statusCode: number;
  readonly success: boolean;
  readonly urgency?: string;
  readonly workflowRunId?: string;
  readonly workflowStatus?: ReceptionistStatus;
};

export async function processReceptionistWorkflowRequest(
  input: ProcessReceptionistWorkflowInput
): Promise<ProcessReceptionistWorkflowResult> {
  const executive = getExecutiveProfileBySlug(input.executiveSlug);

  if (!executive) {
    return {
      error: "invalid_executive",
      providerStatus: "invalid",
      statusCode: 404,
      success: false
    };
  }

  const settings = createCustomerCardSettingsFromExecutiveProfile(executive);
  const workflowRun = runReceptionistWorkflow({
    anonymousVisitorId: input.anonymousVisitorId ?? null,
    executiveName: executive.displayName,
    handoffEmail: settings.receptionist.handoffEmail,
    rateLimitKey: input.rateLimitKey,
    request: input.request,
    sessionId: input.sessionId ?? null,
    source: input.source,
    sourceUrl: input.sourceUrl ?? null
  });

  if (workflowRun.providerStatus === "blocked_by_policy") {
    const rateLimited = workflowRun.blockedReasonCodes.includes("rate_limit_exceeded");

    return {
      error: rateLimited ? "rate_limit_exceeded" : "blocked_by_policy",
      providerStatus: "blocked_by_policy",
      statusCode: rateLimited ? 429 : 400,
      success: false,
      urgency: workflowRun.decision.urgency,
      workflowRunId: workflowRun.runId,
      workflowStatus: workflowRun.providerStatus
    };
  }

  const notification: ReceptionistNotificationPayload = {
    ...workflowRun.notificationPayload,
    request: input.request
  };
  const stored = await storeReceptionistRequest({
    anonymousVisitorId: input.anonymousVisitorId ?? null,
    executiveSlug: input.executiveSlug,
    notification,
    providerStatus: workflowRun.providerStatus,
    request: input.request,
    sessionId: input.sessionId ?? null,
    workflowRun
  });

  return {
    providerStatus: stored.providerStatus,
    requestId: stored.requestId,
    statusCode: 202,
    success: true,
    urgency: workflowRun.decision.urgency,
    workflowRunId: workflowRun.runId,
    workflowStatus: workflowRun.providerStatus
  };
}
