import type { ReceptionistRequest } from "@bidayax/types";

export function createCallbackRequest(request: ReceptionistRequest) {
  if (request.requestType !== "request_callback") {
    return null;
  }

  return {
    callbackTime: request.preferredTime ?? null,
    company: request.company ?? null,
    consentConfirmed: request.consent,
    phone: request.phone ?? null,
    requester: request.name
  };
}
