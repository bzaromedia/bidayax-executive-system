"use client";

import type { MouseEventHandler } from "react";
import { Download } from "lucide-react";
import { Button } from "@bidayax/ui";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";

type ExecutiveVCardButtonProps = {
  readonly executive: ExecutiveProfile;
  readonly onMouseEnter?: MouseEventHandler<HTMLElement>;
  readonly onMouseLeave?: MouseEventHandler<HTMLElement>;
};

export function ExecutiveVCardButton({
  executive,
  onMouseEnter,
  onMouseLeave
}: ExecutiveVCardButtonProps) {
  return (
    <Button
      asChild
      variant="ghost"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <a
        download={executive.vcardFileName}
        href={`/card/${executive.slug}/vcard`}
        onClick={() =>
          emitCardInteraction("vcard_download", executive.slug, {
            action: "vcard_download",
            surface: "executive_card"
          })
        }
      >
        <Download aria-hidden="true" size={16} />
        Save contact
      </a>
    </Button>
  );
}
