import type { CardCustomizationProfile, ExecutiveAvatarConfig } from "@bidayax/types";

export type ResolvedExecutiveAvatar =
  | {
      readonly kind: "image";
      readonly altText: string;
      readonly initials: string;
      readonly src: string;
    }
  | {
      readonly kind: "initials";
      readonly altText: string;
      readonly initials: string;
    };

export function getExecutiveInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function createDefaultAvatarConfig(
  profile: CardCustomizationProfile
): ExecutiveAvatarConfig {
  return {
    altText: `${profile.displayName} profile image`,
    avatarId: `${profile.executiveSlug}-avatar`,
    avatarUrl: profile.avatarUrl,
    executiveSlug: profile.executiveSlug,
    initials: getExecutiveInitials(profile.displayName),
    updatedAt: profile.updatedAt,
    validationStatus: profile.avatarUrl ? "valid" : "missing"
  };
}

export function resolveExecutiveAvatar(
  avatar: ExecutiveAvatarConfig,
  profile: Pick<CardCustomizationProfile, "displayName">
): ResolvedExecutiveAvatar {
  const initials = avatar.initials || getExecutiveInitials(profile.displayName);

  if (avatar.validationStatus === "valid" && avatar.avatarUrl) {
    return {
      altText: avatar.altText,
      initials,
      kind: "image",
      src: avatar.avatarUrl
    };
  }

  return {
    altText: avatar.altText,
    initials,
    kind: "initials"
  };
}
