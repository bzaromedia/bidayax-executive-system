import type { ReceptionistRequest } from "@bidayax/types";

export function createCalendarRequest(request: ReceptionistRequest) {
  if (request.requestType !== "schedule_meeting") {
    return null;
  }

  return {
    company: request.company ?? null,
    consentConfirmed: request.consent,
    meetingTime: request.preferredTime ?? null,
    requester: request.name,
    routingMode: "internal_request"
  };
}
