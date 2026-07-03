import { CalendarCheck2 } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import type { CalendarBookingConfig } from "@bidayax/types";
import { emitCardInteraction } from "../lib/card-events";
import { getExecutiveCalendarPath } from "../lib/calendar";
import { ExecutiveInfoCard } from "./ExecutiveInfoCard";

type ExecutiveMeetingCardProps = {
  readonly calendar?: CalendarBookingConfig;
  readonly executive: ExecutiveProfile;
};

export function ExecutiveMeetingCard({
  calendar,
  executive
}: ExecutiveMeetingCardProps) {
  if (calendar && (!calendar.enabled || calendar.meetingBehavior === "disabled")) {
    return null;
  }

  const href = calendar?.externalCalendarUrl ?? getExecutiveCalendarPath(executive);

  return (
    <ExecutiveInfoCard
      icon={CalendarCheck2}
      title="Book a Meeting"
      action={
        <a
          className="executive-text-link"
          href={href}
          onClick={() =>
            emitCardInteraction("calendar_view", executive.slug, {
              action: "meeting_calendar_open",
              surface: "executive_card_meeting"
            })
          }
        >
          Schedule now
        </a>
      }
    >
      <p>Request time with the executive team for direct follow-up.</p>
    </ExecutiveInfoCard>
  );
}
