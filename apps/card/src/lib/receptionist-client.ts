import type {
  ExecutiveSlug,
  ReceptionistLanguage,
  ReceptionistRequestType,
  ReceptionistStatus
} from "@bidayax/types";
import { getInteractionSession } from "./session";

export type ReceptionistFormInput = {
  readonly executiveSlug: ExecutiveSlug;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly company?: string;
  readonly preferredLanguage: ReceptionistLanguage;
  readonly dialect?: string;
  readonly requestType: ReceptionistRequestType;
  readonly message: string;
  readonly preferredTime?: string;
  readonly consent: boolean;
};

export type ReceptionistSubmitResult = {
  readonly success: boolean;
  readonly callbackWorkflow?: {
    readonly message: string;
    readonly provider: "manual_or_pending";
    readonly status: "queued";
  };
  readonly message?: string;
  readonly requestId?: string;
  readonly providerStatus: ReceptionistStatus;
  readonly workflowRunId?: string;
  readonly workflowStatus?: string;
  readonly urgency?: string;
  readonly error?: string;
};

function getSourceUrl() {
  try {
    return window.location.href;
  } catch {
    return undefined;
  }
}

export async function submitReceptionistRequest(
  input: ReceptionistFormInput
): Promise<ReceptionistSubmitResult> {
  const session = getInteractionSession();
  const response = await window.fetch("/api/receptionist/request", {
    body: JSON.stringify({
      ...input,
      anonymousVisitorId: session?.anonymousVisitorId,
      sessionId: session?.sessionId,
      sourceUrl: getSourceUrl()
    }),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });
  let result: ReceptionistSubmitResult;

  try {
    result = (await response.json()) as ReceptionistSubmitResult;
  } catch {
    return {
      error: "invalid_server_response",
      providerStatus: "event_store_unavailable",
      success: false
    };
  }

  if (!response.ok && result.success !== false) {
    return {
      ...result,
      error: result.error ?? "request_failed",
      success: false
    };
  }

  return result;
}
