import type { ExecutiveProfile } from "@bidayax/config/executives";
import {
  executiveDefaultCalendarSlots,
  getExecutiveProfileBySlug
} from "@bidayax/config/executives";
import type {
  BrandThemeConfig,
  CalendarBookingConfig,
  CardActionConfig,
  CardCustomizationProfile,
  CustomerCardSettings,
  ExecutiveAvatarConfig,
  QRTransferFeedbackConfig,
  ReceptionistSettingsConfig
} from "@bidayax/types";
import { createDefaultAvatarConfig } from "./avatar-settings";
import { defaultExecutiveBrandTheme } from "./brand-theme-resolver";
import { defaultReceptionistGreeting } from "./receptionist-settings";

const defaultUpdatedAt = "1970-01-01T00:00:00.000Z";
const defaultHandoffEmail = "contact@theexecutivecard.com";

function createProfile(executive: ExecutiveProfile): CardCustomizationProfile {
  return {
    addressLine1: executive.addressLine1,
    addressLine2: executive.addressLine2,
    avatarUrl: null,
    bio: executive.bio,
    calendarSettingsId: `${executive.slug}-calendar`,
    company: executive.company,
    displayName: executive.displayName,
    email: executive.email,
    executiveSlug: executive.slug,
    phone: executive.phone,
    profileId: executive.id,
    qrFeedbackSettingsId: `${executive.slug}-qr-feedback`,
    receptionistSettingsId: `${executive.slug}-receptionist`,
    role: executive.role,
    tagline: executive.tagline,
    themeId: executive.theme,
    updatedAt: defaultUpdatedAt,
    website: executive.website
  };
}

function createActions(executiveSlug: string): CardActionConfig {
  return {
    actionConfigId: `${executiveSlug}-actions`,
    callEnabled: true,
    connectEnabled: true,
    downloadEnabled: true,
    emailEnabled: true,
    executiveSlug,
    shareEnabled: true,
    updatedAt: defaultUpdatedAt,
    websiteEnabled: true
  };
}

function createCalendar(executive: ExecutiveProfile): CalendarBookingConfig {
  const slots = executive.calendarSlots ?? executiveDefaultCalendarSlots;

  return {
    availableSlotLabels: slots.map((slot) => slot.label),
    calendarSettingsId: `${executive.slug}-calendar`,
    enabled: true,
    executiveSlug: executive.slug,
    externalCalendarUrl: null,
    meetingBehavior: "internal_request",
    updatedAt: defaultUpdatedAt
  };
}

function createReceptionist(executiveSlug: string): ReceptionistSettingsConfig {
  return {
    consentRequired: true,
    customGreeting: null,
    defaultLanguage: "English",
    enabled: true,
    executiveSlug,
    greetingMode: "standard",
    handoffEmail: defaultHandoffEmail,
    meetingBehavior: "internal_request",
    mood: "confident",
    receptionistId: `${executiveSlug}-receptionist`,
    requestTypes: [
      "schedule_meeting",
      "route_message",
      "request_callback",
      "qualify_lead",
      "general_inquiry",
      "partnership_request",
      "support_request"
    ],
    responseTone: "professional and concise",
    standardGreeting: defaultReceptionistGreeting,
    supportedLanguages: ["English", "Spanish", "Arabic", "French", "Mandarin", "Urdu", "Hindi"],
    voiceStyle: "executive"
  };
}

function createQrFeedback(executiveSlug: string): QRTransferFeedbackConfig {
  return {
    animationEnabled: true,
    executiveSlug,
    hapticsEnabled: true,
    qrFeedbackSettingsId: `${executiveSlug}-qr-feedback`,
    soundEnabled: false,
    updatedAt: defaultUpdatedAt
  };
}

export function createCustomerCardSettingsFromExecutiveProfile(
  executive: ExecutiveProfile,
  overrides?: Partial<{
    readonly actions: CardActionConfig;
    readonly avatar: ExecutiveAvatarConfig;
    readonly brandTheme: BrandThemeConfig;
    readonly calendar: CalendarBookingConfig;
    readonly profile: CardCustomizationProfile;
    readonly qrFeedback: QRTransferFeedbackConfig;
    readonly receptionist: ReceptionistSettingsConfig;
  }>
): CustomerCardSettings {
  const profile = overrides?.profile ?? createProfile(executive);

  return {
    actions: overrides?.actions ?? createActions(executive.slug),
    avatar: overrides?.avatar ?? createDefaultAvatarConfig(profile),
    brandTheme: overrides?.brandTheme ?? defaultExecutiveBrandTheme,
    calendar: overrides?.calendar ?? createCalendar(executive),
    profile,
    qrFeedback: overrides?.qrFeedback ?? createQrFeedback(executive.slug),
    receptionist: overrides?.receptionist ?? createReceptionist(executive.slug)
  };
}

export function getDefaultCustomerCardSettings(executiveSlug: string) {
  const executive = getExecutiveProfileBySlug(executiveSlug);

  return executive ? createCustomerCardSettingsFromExecutiveProfile(executive) : null;
}
