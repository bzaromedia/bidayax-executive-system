import type { CommunicationChannel } from "../types";

export type CommunicationConsentContext = {
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly participantId: string;
  readonly channel: CommunicationChannel;
  readonly purpose: string;
};

export type ConsentDecision = {
  readonly allowed: boolean;
  readonly reasonCodes: readonly string[];
  readonly policyVersion: string;
  readonly recordingAllowed: boolean;
  readonly transcriptionAllowed: boolean;
  readonly disclosureRequired: boolean;
};
