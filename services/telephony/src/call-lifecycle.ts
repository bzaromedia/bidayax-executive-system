import type { TelephonyCallStatus } from "@bidayax/types";

const allowedTransitions: Record<
  TelephonyCallStatus,
  readonly TelephonyCallStatus[]
> = {
  blocked: [],
  cancelled: [],
  completed: [],
  failed: [],
  in_progress: ["completed", "failed"],
  queued: ["ringing"],
  received: ["queued", "blocked", "requires_approval"],
  requires_approval: ["queued", "blocked"],
  ringing: ["in_progress"],
  simulated: ["received"]
};

export function canTransitionCallStatus({
  from,
  to
}: {
  readonly from: TelephonyCallStatus;
  readonly to: TelephonyCallStatus;
}) {
  return allowedTransitions[from].includes(to);
}

export function transitionCallStatus({
  from,
  to
}: {
  readonly from: TelephonyCallStatus;
  readonly to: TelephonyCallStatus;
}) {
  if (!canTransitionCallStatus({ from, to })) {
    throw new Error(`Invalid call transition from ${from} to ${to}.`);
  }

  return to;
}
