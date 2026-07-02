import type { ExecutiveProfile } from "@bidayax/config/executives";
import { ExecutiveAvatar } from "./ExecutiveAvatar";
import { ExecutiveBrandMark } from "./ExecutiveBrandMark";

type ExecutiveHeaderProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveHeader({ executive }: ExecutiveHeaderProps) {
  return (
    <header className="executive-header">
      <ExecutiveBrandMark className="executive-header-mark" />
      <ExecutiveAvatar executive={executive} />
      <div className="executive-heading">
        <h1>{executive.displayName}</h1>
        <p className="executive-role">{executive.role}</p>
        <p className="executive-company">{executive.company}</p>
        <p className="executive-tagline">{executive.tagline}</p>
      </div>
    </header>
  );
}
