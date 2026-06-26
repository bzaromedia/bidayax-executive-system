import { QRCodeSVG } from "qrcode.react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { ExecutiveProfile } from "../data/executives";
import { getExecutiveQrValue } from "../lib/qr";

type QRPanelProps = {
  readonly executive: ExecutiveProfile;
  readonly visible: boolean;
};

export function QRPanel({ executive, visible }: QRPanelProps) {
  const qrValue = getExecutiveQrValue(executive);

  return (
    <Card
      aria-hidden={!visible}
      className="card-panel qr-panel"
      data-qr-visible={visible ? "true" : "false"}
    >
      <CardHeader>
        <Badge variant="accent">QR route</Badge>
        <CardTitle className="text-base">Scan to open card</CardTitle>
        <CardDescription>{qrValue}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="qr-frame" aria-label={`QR code for ${executive.name}`}>
          <QRCodeSVG
            bgColor="transparent"
            fgColor="var(--bx-color-surface-canvas)"
            level="H"
            marginSize={2}
            size={168}
            value={qrValue}
          />
        </div>
      </CardContent>
    </Card>
  );
}
