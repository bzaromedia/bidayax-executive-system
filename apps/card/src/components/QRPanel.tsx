import type { ExecutiveProfile } from "@bidayax/config/executives";
import { ExecutiveQRCode } from "./ExecutiveQRCode";

type QRPanelProps = {
  readonly executive: ExecutiveProfile;
  readonly visible: boolean;
};

export function QRPanel({ executive, visible }: QRPanelProps) {
  return <ExecutiveQRCode executive={executive} visible={visible} />;
}
