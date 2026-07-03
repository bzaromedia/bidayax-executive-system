export const cardCustomizationVoiceStyles = [
  "executive",
  "warm",
  "energetic",
  "calm",
  "luxury",
  "professional"
] as const;

export const cardCustomizationMoods = [
  "confident",
  "friendly",
  "concise",
  "formal",
  "high_energy",
  "calm"
] as const;

export const cardCustomizationGreetingModes = ["standard", "custom"] as const;

export const cardMeetingBehaviors = [
  "internal_request",
  "external_calendar",
  "disabled"
] as const;

export const cardCustomizationRequestTypes = [
  "schedule_meeting",
  "route_message",
  "request_callback",
  "qualify_lead",
  "general_inquiry",
  "partnership_request",
  "support_request"
] as const;

export type CardCustomizationVoiceStyle =
  (typeof cardCustomizationVoiceStyles)[number];

export type CardCustomizationMood = (typeof cardCustomizationMoods)[number];

export type CardCustomizationGreetingMode =
  (typeof cardCustomizationGreetingModes)[number];

export type CardMeetingBehavior = (typeof cardMeetingBehaviors)[number];

export type CardCustomizationRequestType =
  (typeof cardCustomizationRequestTypes)[number];

export type CardCustomizationProfile = {
  readonly profileId: string;
  readonly executiveSlug: string;
  readonly displayName: string;
  readonly role: string;
  readonly company: string;
  readonly bio: string;
  readonly tagline: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly addressLine1: string;
  readonly addressLine2: string;
  readonly avatarUrl: string | null;
  readonly themeId: string;
  readonly receptionistSettingsId: string;
  readonly calendarSettingsId: string;
  readonly qrFeedbackSettingsId: string;
  readonly updatedAt: string;
};

export type BrandThemeConfig = {
  readonly themeId: string;
  readonly ownerId: string;
  readonly brandName: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly surfaceColor: string;
  readonly textColor: string;
  readonly mutedTextColor: string;
  readonly logoUrl: string;
  readonly logoMarkUrl: string;
  readonly fontDisplay: string;
  readonly fontBody: string;
  readonly approved: boolean;
};

export type ExecutiveAvatarConfig = {
  readonly avatarId: string;
  readonly executiveSlug: string;
  readonly avatarUrl: string | null;
  readonly altText: string;
  readonly initials: string;
  readonly validationStatus: "valid" | "missing" | "invalid";
  readonly updatedAt: string;
};

export type CardActionConfig = {
  readonly actionConfigId: string;
  readonly executiveSlug: string;
  readonly callEnabled: boolean;
  readonly emailEnabled: boolean;
  readonly connectEnabled: boolean;
  readonly websiteEnabled: boolean;
  readonly downloadEnabled: boolean;
  readonly shareEnabled: boolean;
  readonly updatedAt: string;
};

export type CalendarBookingConfig = {
  readonly calendarSettingsId: string;
  readonly executiveSlug: string;
  readonly enabled: boolean;
  readonly meetingBehavior: CardMeetingBehavior;
  readonly externalCalendarUrl: string | null;
  readonly availableSlotLabels: readonly string[];
  readonly updatedAt: string;
};

export type ReceptionistSettingsConfig = {
  readonly receptionistId: string;
  readonly executiveSlug: string;
  readonly enabled: boolean;
  readonly voiceStyle: CardCustomizationVoiceStyle;
  readonly mood: CardCustomizationMood;
  readonly greetingMode: CardCustomizationGreetingMode;
  readonly standardGreeting: string;
  readonly customGreeting: string | null;
  readonly supportedLanguages: readonly string[];
  readonly defaultLanguage: string;
  readonly requestTypes: readonly CardCustomizationRequestType[];
  readonly responseTone: string;
  readonly handoffEmail: string;
  readonly meetingBehavior: CardMeetingBehavior;
  readonly consentRequired: boolean;
};

export type QRTransferFeedbackConfig = {
  readonly qrFeedbackSettingsId: string;
  readonly executiveSlug: string;
  readonly hapticsEnabled: boolean;
  readonly soundEnabled: boolean;
  readonly animationEnabled: boolean;
  readonly updatedAt: string;
};

export type CustomerCardSettings = {
  readonly profile: CardCustomizationProfile;
  readonly brandTheme: BrandThemeConfig;
  readonly avatar: ExecutiveAvatarConfig;
  readonly actions: CardActionConfig;
  readonly calendar: CalendarBookingConfig;
  readonly receptionist: ReceptionistSettingsConfig;
  readonly qrFeedback: QRTransferFeedbackConfig;
};

export type CustomizationAuditEvent = {
  readonly auditEventId: string;
  readonly settingType: string;
  readonly oldValueHash: string;
  readonly newValueHash: string;
  readonly actor: string;
  readonly timestamp: string;
  readonly affectedCard: string;
};

