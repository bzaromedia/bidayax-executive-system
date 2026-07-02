import { CalendarCheck2 } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";
import { ExecutiveInfoCard } from "./ExecutiveInfoCard";

type ExecutiveMeetingCardProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveMeetingCard({ executive }: ExecutiveMeetingCardProps) {
  const meetingSubject = encodeURIComponent(
    `Meeting Request - ${executive.displayName}`
  );
  const href =
    executive.calendarUrl ??
    `mailto:${executive.email}?subject=${meetingSubject}`;

  return (
    <ExecutiveInfoCard
      icon={CalendarCheck2}
      title="Book a Meeting"
      action={
        <a
          className="executive-text-link"
          href={href}
          rel={executive.calendarUrl ? "noreferrer" : undefined}
          target={executive.calendarUrl ? "_blank" : undefined}
          onClick={() =>
            emitCardInteraction("email_click", executive.slug, {
              action: executive.calendarUrl ? "meeting_calendar_open" : "meeting_request_email",
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
