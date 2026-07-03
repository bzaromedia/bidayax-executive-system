"use client";

import { Globe2, Mail, Phone, QrCode } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import type { CardActionConfig } from "@bidayax/types";
import { emitCardInteraction } from "../lib/card-events";

type ExecutiveActionGridProps = {
  readonly actions?: CardActionConfig;
  readonly executive: ExecutiveProfile;
  readonly onConnect: () => void;
};

type ExecutiveAction = {
  readonly enabled: boolean;
  readonly href?: string;
  readonly icon: typeof Phone;
  readonly label: string;
  readonly onClick: () => void;
  readonly rel?: string;
  readonly target?: string;
};

function telephoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function ExecutiveActionGrid({
  actions,
  executive,
  onConnect
}: ExecutiveActionGridProps) {
  const actionConfig = actions ?? {
    callEnabled: true,
    connectEnabled: true,
    emailEnabled: true,
    websiteEnabled: true
  };
  const visibleActions: readonly ExecutiveAction[] = [
    {
      enabled: actionConfig.callEnabled,
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
      enabled: actionConfig.emailEnabled,
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
      enabled: actionConfig.connectEnabled,
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
      enabled: actionConfig.websiteEnabled,
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
  ].filter((action) => action.enabled);

  return (
    <nav className="executive-action-grid" aria-label="Executive contact actions">
      {visibleActions.map((action) => {
        const Icon = action.icon;
        const content = (
          <>
            <span className="executive-action-icon" aria-hidden="true">
              <Icon size={26} strokeWidth={1.8} />
            </span>
            <span>{action.label}</span>
          </>
        );

        if (!action.href) {
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
            rel={action.rel}
            target={action.target}
          >
            {content}
          </a>
        );
      })}
    </nav>
  );
}
