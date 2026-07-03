"use client";

import { Download, QrCode, Share2 } from "lucide-react";
import { useState } from "react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import type { CardActionConfig } from "@bidayax/types";
import { emitCardInteraction } from "../lib/card-events";
import { getCardUrl } from "../lib/routes";

type ExecutiveFooterActionsProps = {
  readonly actions?: CardActionConfig;
  readonly executive: ExecutiveProfile;
  readonly onQrOpen: () => void;
};

export function ExecutiveFooterActions({
  actions,
  executive,
  onQrOpen
}: ExecutiveFooterActionsProps) {
  const [shareLabel, setShareLabel] = useState("Share");
  const url = getCardUrl(executive);
  const actionConfig = actions ?? {
    connectEnabled: true,
    downloadEnabled: true,
    shareEnabled: true
  };

  async function handleShare() {
    emitCardInteraction("share_click", executive.slug, {
      action: "share_click",
      surface: "executive_card_footer"
    });

    try {
      if (window.navigator.share) {
        await window.navigator.share({
          text: executive.tagline,
          title: `${executive.displayName} | The Executive Card`,
          url
        });
      } else {
        await window.navigator.clipboard.writeText(url);
        setShareLabel("Copied");
        window.setTimeout(() => setShareLabel("Share"), 2400);
      }
    } catch {
      setShareLabel("Share");
    }
  }

  if (
    !actionConfig.connectEnabled &&
    !actionConfig.downloadEnabled &&
    !actionConfig.shareEnabled
  ) {
    return null;
  }

  return (
    <footer className="executive-footer-actions">
      {actionConfig.connectEnabled ? (
        <button
          className="executive-footer-link"
          type="button"
          onClick={() => {
            emitCardInteraction("qr_scan", executive.slug, {
              action: "qr_sheet_open",
              surface: "executive_card_footer"
            });
            onQrOpen();
          }}
        >
          <QrCode aria-hidden="true" size={18} />
          QR
        </button>
      ) : null}
      {actionConfig.downloadEnabled ? (
        <a
          className="executive-footer-link"
          download={`${executive.slug}-executive-card.zip`}
          href={`/card/${executive.slug}/download`}
        >
          <Download aria-hidden="true" size={18} />
          Download
        </a>
      ) : null}
      {actionConfig.shareEnabled ? (
        <button className="executive-footer-link" type="button" onClick={handleShare}>
          <Share2 aria-hidden="true" size={18} />
          {shareLabel}
        </button>
      ) : null}
    </footer>
  );
}
