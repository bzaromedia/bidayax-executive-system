import type { ExecutiveProfile } from "@bidayax/config/executives";
import { ExecutiveCardProfile } from "./ExecutiveCardProfile";

type ExecutiveCardProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveCard({ executive }: ExecutiveCardProps) {
  return <ExecutiveCardProfile executive={executive} />;
}
