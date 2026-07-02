"use client";

import { Globe2, Mail, Phone, UserRoundPlus } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";

type ExecutiveActionGridProps = {
  readonly executive: ExecutiveProfile;
};

function telephoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function ExecutiveActionGrid({ executive }: ExecutiveActionGridProps) {
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
      download: executive.vcardFileName,
      href: `/card/${executive.slug}/vcard`,
      icon: UserRoundPlus,
      label: "Connect",
      onClick: () =>
        emitCardInteraction("vcard_download", executive.slug, {
          action: "vcard_download",
          surface: "executive_card_action_grid"
        })
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

        return (
          <a
            key={action.label}
            className="executive-action"
            download={"download" in action ? action.download : undefined}
            href={action.href}
            onClick={action.onClick}
            rel={"rel" in action ? action.rel : undefined}
            target={"target" in action ? action.target : undefined}
          >
            <span className="executive-action-icon" aria-hidden="true">
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <span>{action.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
