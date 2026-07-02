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
  readonly requestId?: string;
  readonly providerStatus: ReceptionistStatus;
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
  const result = (await response.json()) as ReceptionistSubmitResult;

  return result;
}
