import { UserRoundPlus } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";
import { ExecutiveInfoCard } from "./ExecutiveInfoCard";

type ExecutiveContactCardProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveContactCard({ executive }: ExecutiveContactCardProps) {
  return (
    <ExecutiveInfoCard
      icon={UserRoundPlus}
      title="Connect"
      action={
        <a
          className="executive-text-link"
          download={executive.vcardFileName}
          href={`/card/${executive.slug}/vcard`}
          onClick={() =>
            emitCardInteraction("vcard_download", executive.slug, {
              action: "vcard_download",
              surface: "executive_card_connect"
            })
          }
        >
          Add contact
        </a>
      }
    >
      <p>Save verified contact details for direct follow-up.</p>
    </ExecutiveInfoCard>
  );
}
