import {
  executiveDefaultCalendarSlots,
  getExecutiveCardUrl,
  type ExecutiveCalendarSlot,
  type ExecutiveProfile
} from "@bidayax/config/executives";

export function getExecutiveCalendarPath(
  executive: Pick<ExecutiveProfile, "slug">
) {
  return `/card/${executive.slug}/calendar`;
}

export function getExecutiveCalendarUrl(
  executive: Pick<ExecutiveProfile, "slug">
) {
  return `${getExecutiveCardUrl(executive)}/calendar`;
}

export function getExecutiveCalendarSlots(
  executive: Pick<ExecutiveProfile, "calendarSlots">
): readonly ExecutiveCalendarSlot[] {
  return executive.calendarSlots && executive.calendarSlots.length > 0
    ? executive.calendarSlots
    : executiveDefaultCalendarSlots;
}
