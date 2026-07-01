import type { ExecutiveProfile } from "@bidayax/config/executives";
import { ExecutiveActionBar } from "./ExecutiveActionBar";

type CardActionsProps = {
  readonly executive: ExecutiveProfile;
};

export function CardActions({ executive }: CardActionsProps) {
  return <ExecutiveActionBar executive={executive} />;
}
