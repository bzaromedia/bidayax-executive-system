"use client";

import { useState } from "react";
import { Headphones, X } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { ReceptionistRequestForm } from "./ReceptionistRequestForm";

type ExecutiveReceptionistCardProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveReceptionistCard({
  executive
}: ExecutiveReceptionistCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
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
            className="executive-modal-sheet"
            aria-label={`Executive Receptionist request for ${executive.displayName}`}
            aria-modal="true"
            role="dialog"
          >
            <div className="executive-modal-header">
              <div className="executive-receptionist-title">
                <Headphones aria-hidden="true" size={22} strokeWidth={1.75} />
                <h2>Executive Receptionist</h2>
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
              Submit a routed request for human-approved executive follow-up.
            </p>
            <ReceptionistRequestForm executiveSlug={executive.slug} />
          </section>
        </div>
      ) : null}
    </>
  );
}
