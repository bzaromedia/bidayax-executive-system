"use client";

import type { MouseEvent } from "react";
import gsap from "gsap";
import { Globe2, Mail, Phone } from "lucide-react";
import { Button, Grid } from "@bidayax/ui";
import { motionTokens } from "@bidayax/tokens";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";
import { ExecutiveShareButton } from "./ExecutiveShareButton";
import { ExecutiveVCardButton } from "./ExecutiveVCardButton";

type ExecutiveActionBarProps = {
  readonly executive: ExecutiveProfile;
};

function durationToSeconds(value: string) {
  return Number.parseFloat(value.replace("ms", "")) / 1000;
}

function shouldReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function handleMotionEnter(event: MouseEvent<HTMLElement>) {
  if (shouldReduceMotion()) {
    return;
  }

  gsap.to(event.currentTarget, {
    y: -2,
    duration: durationToSeconds(motionTokens.duration.fast),
    ease: motionTokens.easing.standard
  });
}

function handleMotionLeave(event: MouseEvent<HTMLElement>) {
  if (shouldReduceMotion()) {
    return;
  }

  gsap.to(event.currentTarget, {
    y: 0,
    duration: durationToSeconds(motionTokens.duration.fast),
    ease: motionTokens.easing.standard
  });
}

export function ExecutiveActionBar({ executive }: ExecutiveActionBarProps) {
  return (
    <Grid columns={2} gap={3} className="w-full">
      <Button
        asChild
        variant="primary"
        onMouseEnter={handleMotionEnter}
        onMouseLeave={handleMotionLeave}
      >
        <a
          href={`tel:${executive.phone.replace(/[^\d+]/g, "")}`}
          onClick={() =>
            emitCardInteraction("call_click", executive.slug, {
              action: "call_click",
              surface: "executive_card"
            })
          }
        >
          <Phone aria-hidden="true" size={16} />
          Call
        </a>
      </Button>
      <Button
        asChild
        variant="secondary"
        onMouseEnter={handleMotionEnter}
        onMouseLeave={handleMotionLeave}
      >
        <a
          href={`mailto:${executive.email}`}
          onClick={() =>
            emitCardInteraction("email_click", executive.slug, {
              action: "email_click",
              surface: "executive_card"
            })
          }
        >
          <Mail aria-hidden="true" size={16} />
          Email
        </a>
      </Button>
      <Button
        asChild
        variant="secondary"
        onMouseEnter={handleMotionEnter}
        onMouseLeave={handleMotionLeave}
      >
        <a
          href={executive.website}
          onClick={() =>
            emitCardInteraction("website_click", executive.slug, {
              action: "website_click",
              surface: "executive_card"
            })
          }
          rel="noreferrer"
          target="_blank"
        >
          <Globe2 aria-hidden="true" size={16} />
          Website
        </a>
      </Button>
      <ExecutiveVCardButton
        executive={executive}
        onMouseEnter={handleMotionEnter}
        onMouseLeave={handleMotionLeave}
      />
      <div className="col-span-2">
        <ExecutiveShareButton
          executive={executive}
          onMouseEnter={handleMotionEnter}
          onMouseLeave={handleMotionLeave}
        />
      </div>
    </Grid>
  );
}
