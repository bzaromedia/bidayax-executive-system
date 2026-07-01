"use client";

import type { MouseEventHandler } from "react";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@bidayax/ui";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";
import { getCardUrl } from "../lib/routes";

type ExecutiveShareButtonProps = {
  readonly executive: ExecutiveProfile;
  readonly onMouseEnter?: MouseEventHandler<HTMLElement>;
  readonly onMouseLeave?: MouseEventHandler<HTMLElement>;
};

export function ExecutiveShareButton({
  executive,
  onMouseEnter,
  onMouseLeave
}: ExecutiveShareButtonProps) {
  const [label, setLabel] = useState("Share");
  const url = getCardUrl(executive);

  async function handleShare() {
    emitCardInteraction("share_click", executive.slug, {
      action: "share_click",
      surface: "executive_card"
    });

    try {
      if (window.navigator.share) {
        await window.navigator.share({
          title: `${executive.displayName} | The Executive Card`,
          text: executive.tagline,
          url
        });
      } else {
        await window.navigator.clipboard.writeText(url);
        setLabel("Link copied");
        window.setTimeout(() => setLabel("Share"), 2400);
      }
    } catch {
      setLabel("Share");
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleShare}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Share2 aria-hidden="true" size={16} />
      {label}
    </Button>
  );
}
