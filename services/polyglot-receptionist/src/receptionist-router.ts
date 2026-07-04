import type { ExecutiveSlug, ReceptionistRequest } from "@bidayax/types";

export function routeReceptionistRequestToExecutive(input: {
  readonly request: ReceptionistRequest;
  readonly executiveSlug: ExecutiveSlug;
  readonly handoffEmail: string;
}) {
  return {
    executiveSlug: input.executiveSlug,
    handoffEmail: input.handoffEmail,
    reason: `Request type ${input.request.requestType} routes to the selected executive card owner.`
  };
}
