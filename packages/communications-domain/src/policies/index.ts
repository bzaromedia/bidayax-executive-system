import type { CommunicationChannel } from "../types";

export type KillSwitchDecision = {
  readonly active: boolean;
  readonly scope: "tenant" | "platform" | null;
  readonly reasonCodes: readonly string[];
};

export type FraudPolicyDecision = {
  readonly allowed: boolean;
  readonly requestedChannel: CommunicationChannel | null;
  readonly reasonCodes: readonly string[];
  readonly retryClass: "none" | "bounded_retry" | "manual_review";
};

export type CommunicationExecutionAuthorization = {
  readonly allowed: boolean;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly actorId: string;
  readonly reasonCodes: readonly string[];
};
