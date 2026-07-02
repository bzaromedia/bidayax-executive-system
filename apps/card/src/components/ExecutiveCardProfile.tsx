import type { ExecutiveProfile } from "@bidayax/config/executives";
import { ExecutiveCardTemplate } from "./ExecutiveCardTemplate";

type ExecutiveCardProfileProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveCardProfile({ executive }: ExecutiveCardProfileProps) {
  return <ExecutiveCardTemplate executive={executive} />;
}
