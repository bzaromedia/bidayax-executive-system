import type {
  TelephonyAppointmentState,
  TelephonyCallbackState,
  TelephonyDomainCallState,
  TelephonyVoicemailState,
  TelephonyStateTransitionEvidence
} from "@bidayax/types";

const callTransitions = {
  answered: ["in_conversation", "transferred", "held", "completed", "failed"],
  busy: [],
  cancelled: [],
  completed: [],
  dialing: ["ringing", "answered", "busy", "no_answer", "failed", "cancelled"],
  failed: [],
  held: ["resumed", "transferred", "completed", "failed"],
  in_conversation: ["transferred", "held", "completed", "failed", "voicemail"],
  no_answer: ["voicemail", "completed"],
  queued: ["dialing", "cancelled", "failed"],
  requested: ["queued", "cancelled", "failed"],
  resumed: ["in_conversation", "transferred", "completed", "failed"],
  ringing: ["answered", "busy", "no_answer", "cancelled", "failed"],
  transferred: ["in_conversation", "completed", "failed"],
  voicemail: ["completed"],
} as const satisfies Record<TelephonyDomainCallState, readonly TelephonyDomainCallState[]>;

const callbackTransitions = {
  assigned: ["attempting", "cancelled"],
  attempting: ["completed", "failed", "scheduled"],
  cancelled: [],
  completed: [],
  failed: ["scheduled", "cancelled"],
  requested: ["scheduled", "assigned", "cancelled"],
  scheduled: ["assigned", "attempting", "cancelled"]
} as const satisfies Record<TelephonyCallbackState, readonly TelephonyCallbackState[]>;

const appointmentTransitions = {
  cancelled: [],
  completed: [],
  confirmed: ["completed", "cancelled"],
  pending: ["confirmed", "cancelled"],
  requested: ["pending", "cancelled"]
} as const satisfies Record<TelephonyAppointmentState, readonly TelephonyAppointmentState[]>;

const voicemailTransitions = {
  archived: [],
  processed: ["archived"],
  received: ["stored"],
  stored: ["processed", "archived"]
} as const satisfies Record<TelephonyVoicemailState, readonly TelephonyVoicemailState[]>;

function canTransition<State extends string>(
  transitions: Record<State, readonly State[]>,
  from: State,
  to: State
) {
  return transitions[from]?.includes(to) ?? false;
}

function transition<State extends string>(
  transitions: Record<State, readonly State[]>,
  label: string,
  from: State,
  to: State
) {
  if (!canTransition(transitions, from, to)) {
    throw new Error(`Invalid ${label} transition from ${from} to ${to}.`);
  }

  return to;
}

export function canTransitionDomainCallState({
  from,
  to
}: {
  readonly from: TelephonyDomainCallState;
  readonly to: TelephonyDomainCallState;
}) {
  return canTransition(callTransitions, from, to);
}

export function transitionDomainCallState({
  from,
  to
}: {
  readonly from: TelephonyDomainCallState;
  readonly to: TelephonyDomainCallState;
}) {
  return transition(callTransitions, "call", from, to);
}

export function canTransitionCallbackState({
  from,
  to
}: {
  readonly from: TelephonyCallbackState;
  readonly to: TelephonyCallbackState;
}) {
  return canTransition(callbackTransitions, from, to);
}

export function transitionCallbackState({
  from,
  to
}: {
  readonly from: TelephonyCallbackState;
  readonly to: TelephonyCallbackState;
}) {
  return transition(callbackTransitions, "callback", from, to);
}

export function canTransitionAppointmentState({
  from,
  to
}: {
  readonly from: TelephonyAppointmentState;
  readonly to: TelephonyAppointmentState;
}) {
  return canTransition(appointmentTransitions, from, to);
}

export function transitionAppointmentState({
  from,
  to
}: {
  readonly from: TelephonyAppointmentState;
  readonly to: TelephonyAppointmentState;
}) {
  return transition(appointmentTransitions, "appointment", from, to);
}

export function canTransitionVoicemailState({
  from,
  to
}: {
  readonly from: TelephonyVoicemailState;
  readonly to: TelephonyVoicemailState;
}) {
  return canTransition(voicemailTransitions, from, to);
}

export function transitionVoicemailState({
  from,
  to
}: {
  readonly from: TelephonyVoicemailState;
  readonly to: TelephonyVoicemailState;
}) {
  return transition(voicemailTransitions, "voicemail", from, to);
}
export function evaluateDomainCallTransition({
  causationId = null,
  correlationId,
  expectedVersion,
  from,
  occurredAt,
  reason,
  to
}: {
  readonly causationId?: string | null;
  readonly correlationId: string;
  readonly expectedVersion: number;
  readonly from: TelephonyDomainCallState;
  readonly occurredAt: string;
  readonly reason: string;
  readonly to: TelephonyDomainCallState;
}): TelephonyStateTransitionEvidence<TelephonyDomainCallState> {
  if (!reason.trim()) {
    throw new Error("Telephony state transitions require a reason.");
  }

  transitionDomainCallState({ from, to });

  return {
    causationId,
    correlationId,
    expectedVersion,
    from,
    nextVersion: expectedVersion + 1,
    occurredAt,
    reason,
    to
  };
}

export const telephonyDomainTransitionTables = {
  appointment: appointmentTransitions,
  callback: callbackTransitions,
  call: callTransitions,
  voicemail: voicemailTransitions
} as const;
