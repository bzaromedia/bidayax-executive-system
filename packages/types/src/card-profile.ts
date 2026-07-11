export const cardProfileStatuses = ["draft", "preview", "published", "archived"] as const;
export const qrDestinationModes = ["card_profile", "direct_contact", "calendar", "custom_url"] as const;
export const cardCtaTypes = ["link", "call", "email", "calendar", "download", "share"] as const;

export type CardProfileStatus = (typeof cardProfileStatuses)[number];
export type QRDestinationMode = (typeof qrDestinationModes)[number];
export type CardCTAType = (typeof cardCtaTypes)[number];

export type SocialLink = {
  readonly platform: string;
  readonly label: string;
  readonly url: string;
  readonly visible: boolean;
};

export type CardCTA = {
  readonly label: string;
  readonly type: CardCTAType;
  readonly destination: string;
  readonly visible: boolean;
};

export type ExecutiveCardProfile = {
  readonly cardId: string;
  readonly tenantId: string;
  readonly executiveName: string;
  readonly title: string;
  readonly company: string;
  readonly bio: string;
  readonly profileImageAssetId: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly calendarUrl: string;
  readonly location: string;
  readonly socialLinks: readonly SocialLink[];
  readonly primaryCTA: CardCTA;
  readonly secondaryCTA: CardCTA;
  readonly qrDestinationMode: QRDestinationMode;
  readonly publishedVersion: string | null;
  readonly draftVersion: string | null;
  readonly status: CardProfileStatus;
};
