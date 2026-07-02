import { Headphones } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { ReceptionistRequestForm } from "./ReceptionistRequestForm";

type ExecutiveReceptionistCardProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveReceptionistCard({
  executive
}: ExecutiveReceptionistCardProps) {
  return (
    <section className="executive-receptionist-card">
      <div className="executive-receptionist-copy">
        <div className="executive-receptionist-title">
          <Headphones aria-hidden="true" size={22} strokeWidth={1.75} />
          <h2>Executive Receptionist</h2>
        </div>
        <p>
          Route meeting requests, callbacks, messages, and qualified inquiries
          to the executive workflow for human-approved follow-up.
        </p>
      </div>
      <ReceptionistRequestForm executiveSlug={executive.slug} />
    </section>
  );
}

