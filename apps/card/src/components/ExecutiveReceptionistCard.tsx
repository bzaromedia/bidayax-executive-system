"use client";

import { useState } from "react";
import { Headphones, MessageSquare, Phone, Send, X } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import type { ResolvedReceptionistBehavior } from "@bidayax/card-customization";
import type { ReceptionistSettingsConfig } from "@bidayax/types";
import { ReceptionistRequestForm } from "./ReceptionistRequestForm";
import { ReceptionistTextChat } from "./ReceptionistTextChat";
import { ReceptionistVoiceChat } from "./ReceptionistVoiceChat";

type ExecutiveReceptionistCardProps = {
  readonly behavior?: ResolvedReceptionistBehavior;
  readonly executive: ExecutiveProfile;
  readonly settings?: ReceptionistSettingsConfig;
};

type ReceptionistMode = "text_chat" | "voice_chat" | "form";

const receptionistModes: readonly {
  readonly id: ReceptionistMode;
  readonly label: string;
}[] = [
  { id: "text_chat", label: "Text Chat" },
  { id: "voice_chat", label: "Voice Chat" },
  { id: "form", label: "Form" }
];

export function ExecutiveReceptionistCard({
  behavior,
  executive,
  settings
}: ExecutiveReceptionistCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ReceptionistMode>("text_chat");
  const phoneHref = `tel:${executive.phone.replace(/[^+\d]/g, "")}`;

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
            Route calls, messages, callback requests, and qualified inquiries through a human-approved executive workflow.
          </p>
        </div>
        <div className="executive-receptionist-actions" aria-label="Receptionist interaction choices">
          <a className="executive-receptionist-choice" href={phoneHref}>
            <Phone aria-hidden="true" size={18} />
            <span>Call</span>
          </a>
          <button
            className="executive-receptionist-choice"
            type="button"
            onClick={() => {
              setMode("text_chat");
              setIsOpen(true);
            }}
          >
            <MessageSquare aria-hidden="true" size={18} />
            <span>Message</span>
          </button>
          <button
            className="executive-receptionist-choice"
            type="button"
            onClick={() => {
              setMode("form");
              setIsOpen(true);
            }}
          >
            <Send aria-hidden="true" size={18} />
            <span>Request Callback</span>
          </button>
        </div>
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
                "Choose text chat, voice transcript mode, or a traditional request form. Provider dispatch remains human-approved."}
            </p>
            <div className="receptionist-mode-tabs" role="tablist" aria-label="Receptionist mode">
              {receptionistModes.map((item) => (
                <button
                  key={item.id}
                  className="receptionist-mode-tab"
                  type="button"
                  role="tab"
                  aria-selected={mode === item.id}
                  onClick={() => setMode(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {mode === "text_chat" ? (
              <ReceptionistTextChat executiveSlug={executive.slug} />
            ) : null}
            {mode === "voice_chat" ? (
              <ReceptionistVoiceChat executiveSlug={executive.slug} />
            ) : null}
            {mode === "form" ? (
              <ReceptionistRequestForm
                defaultRequestTypeOverride="request_callback"
                executiveSlug={executive.slug}
                {...(settings ? { settings } : {})}
              />
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
