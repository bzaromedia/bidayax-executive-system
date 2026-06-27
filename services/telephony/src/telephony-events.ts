import type { TelephonyCallEventType } from "@bidayax/types";

export type TelephonyCallEventDraft = {
  readonly eventType: TelephonyCallEventType;
  readonly payload: Record<string, string | number | boolean | null>;
};

export function createTelephonyEvent(
  eventType: TelephonyCallEventType,
  payload: TelephonyCallEventDraft["payload"] = {}
): TelephonyCallEventDraft {
  return {
    eventType,
    payload
  };
}
