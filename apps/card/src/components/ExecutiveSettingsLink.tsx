import { Settings } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { getCardSettingsDashboardUrl } from "../lib/routes";

type ExecutiveSettingsLinkProps = {
  readonly executive: Pick<ExecutiveProfile, "slug" | "displayName">;
};

export function ExecutiveSettingsLink({ executive }: ExecutiveSettingsLinkProps) {
  return (
    <a
      className="executive-settings-link"
      href={getCardSettingsDashboardUrl(executive)}
      rel="noreferrer"
      target="_blank"
      aria-label={`Open settings dashboard for ${executive.displayName}`}
      title="Settings"
    >
      <Settings aria-hidden="true" size={20} strokeWidth={1.85} />
    </a>
  );
}
