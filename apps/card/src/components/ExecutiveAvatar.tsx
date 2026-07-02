import type { ExecutiveProfile } from "@bidayax/config/executives";

type ExecutiveAvatarProps = {
  readonly executive: ExecutiveProfile;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ExecutiveAvatar({ executive }: ExecutiveAvatarProps) {
  return (
    <div className="executive-avatar" aria-label={`${executive.displayName} profile`}>
      <span aria-hidden="true">{getInitials(executive.displayName)}</span>
    </div>
  );
}
