import type { ExecutiveProfile } from "@bidayax/config/executives";
import type { ResolvedExecutiveAvatar } from "@bidayax/card-customization";

type ExecutiveAvatarProps = {
  readonly avatar: ResolvedExecutiveAvatar;
  readonly executive: ExecutiveProfile;
};

export function ExecutiveAvatar({ avatar, executive }: ExecutiveAvatarProps) {
  if (avatar.kind === "image") {
    return (
      <div className="executive-avatar" aria-label={`${executive.displayName} profile`}>
        <img className="executive-avatar-image" src={avatar.src} alt={avatar.altText} />
      </div>
    );
  }

  return (
    <div className="executive-avatar" aria-label={`${executive.displayName} profile`}>
      <span aria-hidden="true">{avatar.initials}</span>
    </div>
  );
}
