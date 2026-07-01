"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import gsap from "gsap";
import { QrCode } from "lucide-react";
import { Button, Stack } from "@bidayax/ui";
import { motionTokens } from "@bidayax/tokens";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction, getCardLoadEventTypes } from "../lib/card-events";
import { CardFace } from "./CardFace";
import { ContactDetails } from "./ContactDetails";
import { ExecutiveActionBar } from "./ExecutiveActionBar";
import { ExecutiveQRCode } from "./ExecutiveQRCode";

type ExecutiveCardProfileProps = {
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

export function ExecutiveCardProfile({ executive }: ExecutiveCardProfileProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const qrPanelRef = useRef<HTMLDivElement>(null);
  const cardViewLoggedRef = useRef(false);
  const [qrVisible, setQrVisible] = useState(false);

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
    if (!cardRef.current || getReducedMotionPreference()) {
      return;
    }

    gsap.fromTo(
      cardRef.current,
      { autoAlpha: 0, y: 18, rotateX: 3 },
      {
        autoAlpha: 1,
        y: 0,
        rotateX: 0,
        duration: durationToSeconds(motionTokens.duration.deliberate),
        ease: motionTokens.easing.entrance
      }
    );
  }, []);

  useEffect(() => {
    if (!qrPanelRef.current || getReducedMotionPreference()) {
      return;
    }

    gsap.to(qrPanelRef.current, {
      autoAlpha: qrVisible ? 1 : 0,
      y: qrVisible ? 0 : 10,
      duration: durationToSeconds(motionTokens.duration.normal),
      ease: motionTokens.easing.standard,
      pointerEvents: qrVisible ? "auto" : "none"
    });
  }, [qrVisible]);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!cardRef.current || getReducedMotionPreference()) {
      return;
    }

    const bounds = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    gsap.to(cardRef.current, {
      "--reflection-x": `${x * 100}%`,
      "--spotlight-x": `${x * 100}%`,
      "--spotlight-y": `${y * 100}%`,
      "--tilt-x": `${(0.5 - y) * 7}deg`,
      "--tilt-y": `${(x - 0.5) * 7}deg`,
      duration: durationToSeconds(motionTokens.duration.fast),
      ease: motionTokens.easing.standard
    });
  }

  function handlePointerLeave() {
    if (!cardRef.current || getReducedMotionPreference()) {
      return;
    }

    gsap.to(cardRef.current, {
      "--reflection-x": "50%",
      "--spotlight-x": "50%",
      "--spotlight-y": "50%",
      "--tilt-x": "0deg",
      "--tilt-y": "0deg",
      duration: durationToSeconds(motionTokens.duration.normal),
      ease: motionTokens.easing.standard
    });
  }

  return (
    <div
      ref={cardRef}
      className="executive-card-grid w-full"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      style={
        {
          "--reflection-x": "50%",
          "--spotlight-x": "50%",
          "--spotlight-y": "50%",
          "--tilt-x": "0deg",
          "--tilt-y": "0deg"
        } as CSSProperties
      }
    >
      <div className="executive-card-wrap">
        <CardFace executive={executive} />
      </div>
      <Stack gap={4} className="w-full">
        <ContactDetails executive={executive} />
        <ExecutiveActionBar executive={executive} />
        <Button
          aria-controls="qr-panel"
          aria-expanded={qrVisible}
          type="button"
          variant="secondary"
          onClick={() => setQrVisible((current) => !current)}
        >
          <QrCode aria-hidden="true" size={16} />
          {qrVisible ? "Hide QR code" : "Show QR code"}
        </Button>
        <div ref={qrPanelRef} id="qr-panel">
          <ExecutiveQRCode executive={executive} visible={qrVisible} />
        </div>
      </Stack>
    </div>
  );
}
