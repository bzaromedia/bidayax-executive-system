import { QRCodeSVG } from "qrcode.react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { getExecutiveQrValue } from "../lib/qr";

type ExecutiveQRCodeProps = {
  readonly executive: ExecutiveProfile;
  readonly visible: boolean;
};

export function ExecutiveQRCode({ executive, visible }: ExecutiveQRCodeProps) {
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
        <div className="qr-frame" aria-label={`QR code for ${executive.displayName}`}>
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
