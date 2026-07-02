import type { ExecutiveProfile } from "@bidayax/config/executives";
import { ExecutiveAvatar } from "./ExecutiveAvatar";
import { ExecutiveBrandMark } from "./ExecutiveBrandMark";

type ExecutiveHeaderProps = {
  readonly executive: ExecutiveProfile;
};

export function ExecutiveHeader({ executive }: ExecutiveHeaderProps) {
  return (
    <header className="executive-header">
      <div className="executive-brand-lockup" aria-label="The Executive Card">
        <ExecutiveBrandMark className="executive-brand-mark" />
        <span>The Executive Card</span>
      </div>
      <ExecutiveAvatar executive={executive} />
      <div className="executive-heading">
        <p className="executive-kicker">Executive identity intelligence</p>
        <h1>{executive.displayName}</h1>
        <p className="executive-role">{executive.role}</p>
        <p className="executive-company">{executive.company}</p>
        <p className="executive-tagline">{executive.tagline}</p>
      </div>
    </header>
  );
}
