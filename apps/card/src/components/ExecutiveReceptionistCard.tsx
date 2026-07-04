"use client";

import { useState } from "react";
import { Headphones, X } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import type { ResolvedReceptionistBehavior } from "@bidayax/card-customization";
import type { ReceptionistSettingsConfig } from "@bidayax/types";
import { ReceptionistRequestForm } from "./ReceptionistRequestForm";

type ExecutiveReceptionistCardProps = {
  readonly behavior?: ResolvedReceptionistBehavior;
  readonly executive: ExecutiveProfile;
  readonly settings?: ReceptionistSettingsConfig;
};

export function ExecutiveReceptionistCard({
  behavior,
  executive,
  settings
}: ExecutiveReceptionistCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (settings && !settings.enabled) {
    return null;
  }

  return (
    <>
      <section className="executive-receptionist-card">
        <div className="executive-receptionist-copy">
          <div className="executive-receptionist-title">
            <Headphones aria-hidden="true" size={22} strokeWidth={1.75} />
            <h2>Polyglot Receptionist™</h2>
          </div>
          <p>
            Open a routed multilingual workflow for meeting requests, callbacks, messages, and qualified inquiries.
          </p>
        </div>
        <button
          className="executive-receptionist-open"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          Open Receptionist
        </button>
      </section>
      {isOpen ? (
        <div className="executive-modal-backdrop" role="presentation">
          <section
            className="executive-modal-sheet executive-receptionist-sheet"
            aria-label={`Polyglot Receptionist request for ${executive.displayName}`}
            aria-modal="true"
            role="dialog"
          >
            <div className="executive-modal-header">
              <div className="executive-receptionist-title">
                <Headphones aria-hidden="true" size={22} strokeWidth={1.75} />
                <h2>Polyglot Receptionist™</h2>
              </div>
              <button
                className="executive-modal-close"
                type="button"
                aria-label="Close receptionist request"
                onClick={() => setIsOpen(false)}
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <p className="executive-modal-intro">
              {behavior?.greetingText ??
                "Share your request. The workflow queues it for human-approved executive follow-up."}
            </p>
            <ReceptionistRequestForm
              executiveSlug={executive.slug}
              {...(settings ? { settings } : {})}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}
