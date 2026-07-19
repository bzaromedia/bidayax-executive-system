export const communicationLifecycleStates = [
  "requested",
  "policy_checking",
  "authorized",
  "queued",
  "dispatching",
  "accepted",
  "active",
  "completed",
  "blocked",
  "cancelled",
  "failed",
  "expired",
  "suppressed",
  "terminated"
] as const;

export type CommunicationLifecycleState =
  (typeof communicationLifecycleStates)[number];

export const communicationTerminalStates = [
  "completed",
  "blocked",
  "cancelled",
  "failed",
  "expired",
  "suppressed",
  "terminated"
] as const satisfies readonly CommunicationLifecycleState[];

export const communicationRetryableStates = [
  "queued",
  "dispatching",
  "accepted"
] as const satisfies readonly CommunicationLifecycleState[];

const allowedTransitions: Readonly<
  Record<CommunicationLifecycleState, readonly CommunicationLifecycleState[]>
> = {
  accepted: ["active", "completed", "failed", "terminated"],
  active: ["completed", "failed", "terminated"],
  authorized: ["queued", "blocked", "suppressed", "cancelled"],
  blocked: [],
  cancelled: [],
  completed: [],
  dispatching: ["accepted", "failed", "terminated"],
  expired: [],
  failed: [],
  policy_checking: ["authorized", "blocked", "suppressed", "expired"],
  queued: ["dispatching", "cancelled", "expired", "suppressed"],
  requested: ["policy_checking", "blocked", "suppressed", "cancelled"],
  suppressed: [],
  terminated: []
};

export function canTransitionCommunicationLifecycleState(input: {
  readonly from: CommunicationLifecycleState;
  readonly to: CommunicationLifecycleState;
}) {
  return allowedTransitions[input.from].includes(input.to);
}

export function transitionCommunicationLifecycleState(input: {
  readonly from: CommunicationLifecycleState;
  readonly to: CommunicationLifecycleState;
}) {
  if (!canTransitionCommunicationLifecycleState(input)) {
    throw new Error(
      `Invalid communication lifecycle transition from ${input.from} to ${input.to}.`
    );
  }

  return input.to;
}

export const communicationLifecycleTransitionTable = allowedTransitions;