"use client";

import { Globe2, Mail, Phone, QrCode } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";

type ExecutiveActionGridProps = {
  readonly executive: ExecutiveProfile;
  readonly onConnect: () => void;
};

function telephoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function ExecutiveActionGrid({
  executive,
  onConnect
}: ExecutiveActionGridProps) {
  const actions = [
    {
      href: telephoneHref(executive.phone),
      icon: Phone,
      label: "Call",
      onClick: () =>
        emitCardInteraction("call_click", executive.slug, {
          action: "call_click",
          surface: "executive_card_action_grid"
        })
    },
    {
      href: `mailto:${executive.email}`,
      icon: Mail,
      label: "Email",
      onClick: () =>
        emitCardInteraction("email_click", executive.slug, {
          action: "email_click",
          surface: "executive_card_action_grid"
        })
    },
    {
      icon: QrCode,
      label: "Connect",
      onClick: () => {
        emitCardInteraction("qr_scan", executive.slug, {
          action: "connect_qr_open",
          surface: "executive_card_action_grid"
        });
        onConnect();
      }
    },
    {
      href: executive.website,
      icon: Globe2,
      label: "Website",
      onClick: () =>
        emitCardInteraction("website_click", executive.slug, {
          action: "website_click",
          surface: "executive_card_action_grid"
        }),
      rel: "noreferrer",
      target: "_blank"
    }
  ] as const;

  return (
    <nav className="executive-action-grid" aria-label="Executive contact actions">
      {actions.map((action) => {
        const Icon = action.icon;
        const content = (
          <>
            <span className="executive-action-icon" aria-hidden="true">
              <Icon size={26} strokeWidth={1.8} />
            </span>
            <span>{action.label}</span>
          </>
        );

        if (!("href" in action)) {
          return (
            <button
              key={action.label}
              className="executive-action"
              type="button"
              onClick={action.onClick}
            >
              {content}
            </button>
          );
        }

        return (
          <a
            key={action.label}
            className="executive-action"
            href={action.href}
            onClick={action.onClick}
            rel={"rel" in action ? action.rel : undefined}
            target={"target" in action ? action.target : undefined}
          >
            {content}
          </a>
        );
      })}
    </nav>
  );
}
