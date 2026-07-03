import type { CalendarBookingConfig } from "@bidayax/types";

export type ResolvedCalendarBooking = {
  readonly enabled: boolean;
  readonly externalCalendarUrl: string | null;
  readonly meetingBehavior: CalendarBookingConfig["meetingBehavior"];
  readonly slotLabels: readonly string[];
};

export function resolveCalendarBooking(
  settings: CalendarBookingConfig
): ResolvedCalendarBooking {
  return {
    enabled: settings.enabled && settings.meetingBehavior !== "disabled",
    externalCalendarUrl: settings.externalCalendarUrl,
    meetingBehavior: settings.meetingBehavior,
    slotLabels: settings.availableSlotLabels
  };
}
