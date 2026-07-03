import { z } from "zod";
import {
  cardCustomizationGreetingModes,
  cardCustomizationMoods,
  cardCustomizationRequestTypes,
  cardCustomizationVoiceStyles,
  cardMeetingBehaviors,
  receptionistLanguages
} from "@bidayax/types";
import { isSupportedThemeColor } from "./theme-validation";

const colorSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .refine(isSupportedThemeColor, "Color must be a valid approved token or CSS color.");

const urlPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => value.startsWith("/") || value.startsWith("https://"), {
    message: "Asset URLs must be local paths or HTTPS URLs."
  });

export const cardCustomizationProfileSchema = z
  .object({
    addressLine1: z.string().trim().min(1).max(180),
    addressLine2: z.string().trim().min(1).max(180),
    avatarUrl: z.string().trim().min(1).max(2048).nullable(),
    bio: z.string().trim().min(1).max(800),
    calendarSettingsId: z.string().trim().min(1).max(120),
    company: z.string().trim().min(1).max(160),
    displayName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    executiveSlug: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(40),
    profileId: z.string().trim().min(1).max(120),
    qrFeedbackSettingsId: z.string().trim().min(1).max(120),
    receptionistSettingsId: z.string().trim().min(1).max(120),
    role: z.string().trim().min(1).max(160),
    tagline: z.string().trim().min(1).max(240),
    themeId: z.string().trim().min(1).max(120),
    updatedAt: z.string().trim().datetime(),
    website: z.string().trim().url().max(2048)
  })
  .strict();

export const brandThemeConfigSchema = z
  .object({
    accentColor: colorSchema,
    approved: z.boolean(),
    backgroundColor: colorSchema,
    brandName: z.string().trim().min(1).max(160),
    fontBody: z.string().trim().min(1).max(80),
    fontDisplay: z.string().trim().min(1).max(80),
    logoMarkUrl: urlPathSchema,
    logoUrl: urlPathSchema,
    mutedTextColor: colorSchema,
    ownerId: z.string().trim().min(1).max(120),
    primaryColor: colorSchema,
    secondaryColor: colorSchema,
    surfaceColor: colorSchema,
    textColor: colorSchema,
    themeId: z.string().trim().min(1).max(120)
  })
  .strict();

export const executiveAvatarConfigSchema = z
  .object({
    altText: z.string().trim().min(1).max(180),
    avatarId: z.string().trim().min(1).max(120),
    avatarUrl: urlPathSchema.nullable(),
    executiveSlug: z.string().trim().min(2).max(120),
    initials: z.string().trim().min(1).max(4),
    updatedAt: z.string().trim().datetime(),
    validationStatus: z.enum(["valid", "missing", "invalid"])
  })
  .strict();

export const cardActionConfigSchema = z
  .object({
    actionConfigId: z.string().trim().min(1).max(120),
    callEnabled: z.boolean(),
    connectEnabled: z.boolean(),
    downloadEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    executiveSlug: z.string().trim().min(2).max(120),
    shareEnabled: z.boolean(),
    updatedAt: z.string().trim().datetime(),
    websiteEnabled: z.boolean()
  })
  .strict();

export const calendarBookingConfigSchema = z
  .object({
    availableSlotLabels: z.array(z.string().trim().min(1).max(120)).max(12),
    calendarSettingsId: z.string().trim().min(1).max(120),
    enabled: z.boolean(),
    executiveSlug: z.string().trim().min(2).max(120),
    externalCalendarUrl: z.string().trim().url().max(2048).nullable(),
    meetingBehavior: z.enum(cardMeetingBehaviors),
    updatedAt: z.string().trim().datetime()
  })
  .strict();

export const receptionistSettingsConfigSchema = z
  .object({
    consentRequired: z.boolean(),
    customGreeting: z.string().trim().min(1).max(280).nullable(),
    defaultLanguage: z.enum(receptionistLanguages),
    enabled: z.boolean(),
    executiveSlug: z.string().trim().min(2).max(120),
    greetingMode: z.enum(cardCustomizationGreetingModes),
    handoffEmail: z.string().trim().email().max(254),
    meetingBehavior: z.enum(cardMeetingBehaviors),
    mood: z.enum(cardCustomizationMoods),
    receptionistId: z.string().trim().min(1).max(120),
    requestTypes: z.array(z.enum(cardCustomizationRequestTypes)).min(1).max(8),
    responseTone: z.string().trim().min(1).max(160),
    standardGreeting: z.string().trim().min(1).max(280),
    supportedLanguages: z.array(z.enum(receptionistLanguages)).min(1).max(7),
    voiceStyle: z.enum(cardCustomizationVoiceStyles)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.greetingMode === "custom" && !value.customGreeting) {
      ctx.addIssue({
        code: "custom",
        message: "Custom greeting is required for custom greeting mode.",
        path: ["customGreeting"]
      });
    }
  });

export const qrTransferFeedbackConfigSchema = z
  .object({
    animationEnabled: z.boolean(),
    executiveSlug: z.string().trim().min(2).max(120),
    hapticsEnabled: z.boolean(),
    qrFeedbackSettingsId: z.string().trim().min(1).max(120),
    soundEnabled: z.boolean(),
    updatedAt: z.string().trim().datetime()
  })
  .strict();

export const customerCardSettingsSchema = z
  .object({
    actions: cardActionConfigSchema,
    avatar: executiveAvatarConfigSchema,
    brandTheme: brandThemeConfigSchema,
    calendar: calendarBookingConfigSchema,
    profile: cardCustomizationProfileSchema,
    qrFeedback: qrTransferFeedbackConfigSchema,
    receptionist: receptionistSettingsConfigSchema
  })
  .strict();

