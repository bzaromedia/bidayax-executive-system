import { CalendarCheck2 } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";
import { ExecutiveInfoCard } from "./ExecutiveInfoCard";

type ExecutiveMeetingCardProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveMeetingCard({ executive }: ExecutiveMeetingCardProps) {
  const meetingSubject = encodeURIComponent(
    `Meeting request for ${executive.displayName}`
  );

  return (
    <ExecutiveInfoCard
      icon={CalendarCheck2}
      title="Book a Meeting"
      action={
        <a
          className="executive-text-link"
          href={`mailto:${executive.email}?subject=${meetingSubject}`}
          onClick={() =>
            emitCardInteraction("email_click", executive.slug, {
              action: "meeting_request_email",
              surface: "executive_card_meeting"
            })
          }
        >
          Request meeting
        </a>
      }
    >
      <p>Send a meeting request directly to the executive contact mailbox.</p>
    </ExecutiveInfoCard>
  );
}
