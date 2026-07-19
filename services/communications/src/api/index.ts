import type { CommunicationCommand } from "@bidayax/communications-domain";

export const communicationsApiOperationNames = [
  "requestCallback",
  "cancelCallback",
  "scheduleCommunication",
  "initiateCommunication",
  "acceptInboundCommunicationEvent",
  "escalateToHuman",
  "suppressCommunication",
  "releaseSuppression",
  "evaluateConsent",
  "evaluateBusinessHours",
  "evaluateRouting",
  "queryCommunicationStatus",
  "terminateCommunication",
  "applyTenantKillSwitch",
  "applyPlatformKillSwitch"
] as const;

export type CommunicationsApiAcceptance = {
  readonly accepted: boolean;
  readonly communicationId: string | null;
  readonly reasonCodes: readonly string[];
};

export interface CommunicationsApi {
  dispatch(command: CommunicationCommand): Promise<CommunicationsApiAcceptance>;
}
