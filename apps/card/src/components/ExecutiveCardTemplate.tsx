"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, PointerEvent } from "react";
import gsap from "gsap";
import { QRCodeSVG } from "qrcode.react";
import { UserRound } from "lucide-react";
import { motionTokens } from "@bidayax/tokens";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction, getCardLoadEventTypes } from "../lib/card-events";
import { getExecutiveQrValue } from "../lib/qr";
import { ExecutiveActionGrid } from "./ExecutiveActionGrid";
import { ExecutiveBrandMark } from "./ExecutiveBrandMark";
import { ExecutiveCompanyCard } from "./ExecutiveCompanyCard";
import { ExecutiveContactCard } from "./ExecutiveContactCard";
import { ExecutiveFooterActions } from "./ExecutiveFooterActions";
import { ExecutiveHeader } from "./ExecutiveHeader";
import { ExecutiveInfoCard } from "./ExecutiveInfoCard";
import { ExecutiveMeetingCard } from "./ExecutiveMeetingCard";

type ExecutiveCardTemplateProps = {
  readonly executive: ExecutiveProfile;
};

function durationToSeconds(value: string) {
  return Number.parseFloat(value.replace("ms", "")) / 1000;
}

function getReducedMotionPreference() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ExecutiveCardTemplate({ executive }: ExecutiveCardTemplateProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardViewLoggedRef = useRef(false);
  const qrValue = getExecutiveQrValue(executive);

  useEffect(() => {
    if (cardViewLoggedRef.current) {
      return;
    }

    cardViewLoggedRef.current = true;

    for (const eventType of getCardLoadEventTypes()) {
      emitCardInteraction(eventType, executive.slug, {
        action: "route_load",
        surface: "executive_card"
      });
    }
  }, [executive.slug]);

  useEffect(() => {
    if (!stageRef.current || getReducedMotionPreference()) {
      return;
    }

    gsap.fromTo(
      stageRef.current,
      { autoAlpha: 0, y: 18, rotateX: 2 },
      {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        duration: durationToSeconds(motionTokens.duration.deliberate),
        ease: motionTokens.easing.entrance
      }
    );
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!stageRef.current || getReducedMotionPreference()) {
      return;
    }

    const bounds = stageRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    gsap.to(stageRef.current, {
      "--reflection-x": `${x * 100}%`,
      "--spotlight-x": `${x * 100}%`,
      "--spotlight-y": `${y * 100}%`,
      "--tilt-x": `${(0.5 - y) * 3}deg`,
      "--tilt-y": `${(x - 0.5) * 3}deg`,
      duration: durationToSeconds(motionTokens.duration.fast),
      ease: motionTokens.easing.standard
    });
  }

  function handlePointerLeave() {
    if (!stageRef.current || getReducedMotionPreference()) {
      return;
    }

    gsap.to(stageRef.current, {
      "--reflection-x": "50%",
      "--spotlight-x": "50%",
      "--spotlight-y": "45%",
      "--tilt-x": "0deg",
      "--tilt-y": "0deg",
      duration: durationToSeconds(motionTokens.duration.normal),
      ease: motionTokens.easing.standard
    });
  }

  return (
    <div
      ref={stageRef}
      className="executive-template"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={
        {
          "--reflection-x": "50%",
          "--spotlight-x": "50%",
          "--spotlight-y": "45%",
          "--tilt-x": "0deg",
          "--tilt-y": "0deg"
        } as CSSProperties
      }
    >
      <aside className="executive-brand-card" aria-label="The Executive Card QR preview">
        <div className="executive-brand-card-metal" aria-hidden="true" />
        <div className="executive-brand-card-content">
          <ExecutiveBrandMark className="executive-brand-card-mark" />
          <p>The Executive Card</p>
          <div className="executive-brand-card-qr" aria-label={`QR code for ${executive.displayName}`}>
            <QRCodeSVG
              bgColor="var(--bx-color-content-primary)"
              fgColor="var(--bx-color-surface-canvas)"
              level="H"
              marginSize={2}
              size={128}
              title={`QR link for ${executive.displayName}`}
              value={qrValue}
            />
          </div>
          <span>Scan to connect</span>
        </div>
      </aside>

      <section className="executive-phone-shell" aria-label={`${executive.displayName} executive card`}>
        <div className="executive-phone-glass" aria-hidden="true" />
        <div className="executive-card-surface">
          <ExecutiveHeader executive={executive} />
          <ExecutiveActionGrid executive={executive} />
          <div className="executive-info-stack">
            <ExecutiveInfoCard icon={UserRound} title="About Me">
              <p>{executive.bio}</p>
            </ExecutiveInfoCard>
            <ExecutiveMeetingCard executive={executive} />
            <ExecutiveContactCard executive={executive} />
            <ExecutiveCompanyCard executive={executive} />
          </div>
          <ExecutiveFooterActions executive={executive} />
        </div>
      </section>
    </div>
  );
}
