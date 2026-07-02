import { Building2 } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";
import { ExecutiveInfoCard } from "./ExecutiveInfoCard";

type ExecutiveCompanyCardProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveCompanyCard({ executive }: ExecutiveCompanyCardProps) {
  return (
    <ExecutiveInfoCard
      icon={Building2}
      title="Company"
      action={
        <a
          className="executive-text-link"
          href={executive.website}
          rel="noreferrer"
          target="_blank"
          onClick={() =>
            emitCardInteraction("website_click", executive.slug, {
              action: "website_click",
              surface: "executive_card_company"
            })
          }
        >
          Visit website
        </a>
      }
    >
      <p>{executive.company}</p>
      <p>{executive.address}</p>
    </ExecutiveInfoCard>
  );
}
