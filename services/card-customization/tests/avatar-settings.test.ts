import { describe, expect, it } from "vitest";
import type { CardCustomizationProfile, ExecutiveAvatarConfig } from "@bidayax/types";
import { createDefaultAvatarConfig, resolveExecutiveAvatar } from "../src/avatar-settings";

const profile: CardCustomizationProfile = {
  addressLine1: "8 The Green Ste A",
  addressLine2: "Dover, DE 19901",
  avatarUrl: "/uploads/avatars/ad-garner.png",
  bio: "Executive profile",
  calendarSettingsId: "ad-garner-calendar",
  company: "BidayaX LLC",
  displayName: "A.D Garner",
  email: "contact@theexecutivecard.com",
  executiveSlug: "ad-garner",
  phone: "+1 (302) 330-5547",
  profileId: "exec-ad-garner",
  qrFeedbackSettingsId: "ad-garner-qr-feedback",
  receptionistSettingsId: "ad-garner-receptionist",
  role: "COO / CTO / Founder",
  tagline: "Executive identity intelligence",
  themeId: "executive-black-gold",
  updatedAt: "1970-01-01T00:00:00.000Z",
  website: "https://theexecutivecard.online"
};

describe("avatar settings", () => {
  it("uses a configured valid avatar", () => {
    const avatar = createDefaultAvatarConfig(profile);
    const resolved = resolveExecutiveAvatar(avatar, profile);

    expect(resolved.kind).toBe("image");
    expect("src" in resolved ? resolved.src : null).toBe(profile.avatarUrl);
  });

  it("falls back to initials when the avatar is missing", () => {
    const avatar: ExecutiveAvatarConfig = {
      ...createDefaultAvatarConfig({ ...profile, avatarUrl: null }),
      validationStatus: "missing"
    };
    const resolved = resolveExecutiveAvatar(avatar, profile);

    expect(resolved.kind).toBe("initials");
    expect(resolved.initials).toBe("AG");
  });
});
