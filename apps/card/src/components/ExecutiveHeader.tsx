import type { ExecutiveProfile } from "@bidayax/config/executives";
import type { ResolvedExecutiveAvatar } from "@bidayax/card-customization";
import { ExecutiveAvatar } from "./ExecutiveAvatar";

type ExecutiveHeaderProps = {
  readonly avatar: ResolvedExecutiveAvatar;
  readonly executive: ExecutiveProfile;
};

export function ExecutiveHeader({ avatar, executive }: ExecutiveHeaderProps) {
  return (
    <header className="executive-header">
      <ExecutiveAvatar avatar={avatar} executive={executive} />
      <div className="executive-heading">
        <h1>{executive.displayName}</h1>
        <p className="executive-role">{executive.role}</p>
        <p className="executive-company">{executive.company}</p>
        <p className="executive-tagline">{executive.tagline}</p>
      </div>
    </header>
  );
}
