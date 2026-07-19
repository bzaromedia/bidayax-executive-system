import type { CommunicationChannel } from "../types";

export type BusinessHoursDecision = {
  readonly inHours: boolean;
  readonly reasonCodes: readonly string[];
  readonly timezone: string;
};

export type RoutingDecision = {
  readonly allowed: boolean;
  readonly selectedChannel: CommunicationChannel | null;
  readonly selectedAdapterId: string | null;
  readonly reasonCodes: readonly string[];
};

export type EscalationDecision = {
  readonly required: boolean;
  readonly escalationTarget: string | null;
  readonly reasonCodes: readonly string[];
};
