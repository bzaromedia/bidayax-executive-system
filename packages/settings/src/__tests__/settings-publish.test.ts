import { describe, expect, it } from "vitest";
import { primitiveColors } from "@bidayax/tokens";
import type {
  ExecutiveCardProfile,
  ReceptionistSettings,
  ResolvedBrandTokens,
  TenantBrandProfile
} from "@bidayax/types";
import {
  createCardSettingsSnapshot,
  createSettingsDraft
} from "../settings-versioning";
import {
  publishSettingsVersion,
  validateSettingsForPublish
} from "../settings-publish";

const createdAt = "2026-07-08T13:00:00.000Z";

function brandProfile(): TenantBrandProfile {
  return {
    accentColor: primitiveColors.gold.brand,
    backgroundColor: primitiveColors.black.brand,
    buttonRadius: "0.5rem",
    cardRadius: "0.75rem",
    companyName: "BidayaX LLC",
    contrastMode: "standard",
    createdAt,
    faviconAssetId: "mark",
    fontFamily: "Inter",
    logoAssetId: "logo",
    motionIntensity: "standard",
    primaryColor: primitiveColors.gold.brand,
    secondaryColor: primitiveColors.charcoal.brand,
    tenantId: "tenant-bidayax",
    textColor: primitiveColors.neutral.pureWhite,
    updatedAt: createdAt
  };
}

function resolvedTokens(overrides: Partial<ResolvedBrandTokens> = {}): ResolvedBrandTokens {
  return {
    accessibility: {
      actionContrast: 12.4,
      contrastMode: "standard",
      fallbackApplied: false,
      minimumContrastRatio: 4.5,
      textOnBackgroundContrast: 18.8,
      wcagLevel: "AA"
    },
    colors: {
      accent: primitiveColors.gold.brand,
      actionPrimary: primitiveColors.gold.brand,
      actionText: primitiveColors.black.brand,
      background: primitiveColors.black.brand,
      focus: primitiveColors.gold.brand,
      mutedText: primitiveColors.neutral.mutedGray,
      primary: primitiveColors.gold.brand,
      secondary: primitiveColors.charcoal.brand,
      surface: primitiveColors.charcoal.brand,
      text: primitiveColors.neutral.pureWhite
    },
    createdAt,
    motion: {
      durationToken: "200ms",
      intensity: "standard"
    },
    radius: {
      buttonRadius: "0.5rem",
      cardRadius: "0.75rem"
    },
    resolverVersion: "2.0.0-phase-2b",
    snapshotHash: "token-snapshot-valid",
    sourceBrandProfileId: "tenant-bidayax:tenant-brand-profile",
    tenantId: "tenant-bidayax",
    typography: {
      bodyFont: "Inter",
      displayFont: "Playfair Display",
      fontFamily: "Inter"
    },
    warnings: [],
    ...overrides
  };
}

function cardProfile(overrides: Partial<ExecutiveCardProfile> = {}): ExecutiveCardProfile {
  return {
    bio: "Executive identity and operating leadership.",
    calendarUrl: "https://theexecutivecard.online/card/ad-garner/calendar",
    cardId: "card-ad-garner",
    company: "BidayaX LLC",
    draftVersion: null,
    email: "contact@theexecutivecard.com",
    executiveName: "A.D Garner",
    location: "8 The Green Ste A, Dover, DE 19901",
    phone: "+1 (302) 330-5547",
    primaryCTA: {
      destination: "tel:+13023305547",
      label: "Call",
      type: "call",
      visible: true
    },
    profileImageAssetId: "avatar-ad-garner",
    publishedVersion: null,
    qrDestinationMode: "card_profile",
    secondaryCTA: {
      destination: "mailto:contact@theexecutivecard.com",
      label: "Email",
      type: "email",
      visible: true
    },
    socialLinks: [],
    status: "draft",
    tenantId: "tenant-bidayax",
    title: "COO / CTO / Founder",
    website: "https://theexecutivecard.online",
    ...overrides
  };
}

function receptionistSettings(
  overrides: Partial<ReceptionistSettings> = {}
): ReceptionistSettings {
  return {
    afterHoursBehavior: "queue_next_business_day",
    appointmentRules: {
      allowedWindows: ["weekday-business-hours"],
      calendarUrl: null,
      enabled: true,
      requireHumanApproval: true,
      timezone: "America/New_York"
    },
    callRoutingRules: [],
    consentDisclosure: "This AI receptionist may route and summarize your request.",
    customGreeting: null,
    defaultLanguage: "English",
    enabled: true,
    escalationContacts: [],
    fallbackBehavior: "queue_callback",
    greetingMode: "standard",
    mood: "confident",
    recordingPolicy: "transcript_only",
    standardGreeting: "Welcome. I can help route your request.",
    supportedLanguages: ["English", "Spanish"],
    tenantId: "tenant-bidayax",
    voiceProfile: "professional",
    ...overrides
  };
}

function draftVersion(input: {
  readonly card?: Partial<ExecutiveCardProfile>;
  readonly receptionist?: Partial<ReceptionistSettings>;
  readonly tokens?: Partial<ResolvedBrandTokens>;
} = {}) {
  const tokenSnapshot = resolvedTokens(input.tokens);
  const snapshot = createCardSettingsSnapshot({
    brandProfile: brandProfile(),
    cardProfile: cardProfile(input.card),
    generatedAt: createdAt,
    receptionistSettings: receptionistSettings(input.receptionist),
    resolvedBrandTokens: tokenSnapshot
  });

  return createSettingsDraft({
    actorId: "owner-1",
    createdAt,
    settingsSnapshot: snapshot
  }).version;
}

describe("settings publish flow", () => {
  it("validates a publish-ready draft", () => {
    const validation = validateSettingsForPublish(draftVersion());

    expect(validation.valid).toBe(true);
    expect(validation.checks.some((check) => check.checkId === "brand.snapshot.wcag_aa")).toBe(true);
  });

  it("publishes a draft through preview and returns required result fields", () => {
    const result = publishSettingsVersion({
      actorId: "owner-1",
      publishedAt: "2026-07-08T13:05:00.000Z",
      sourceVersion: draftVersion()
    });

    expect(result.ok).toBe(true);
    expect(result.publishedVersionId).toBeTruthy();
    expect(result.snapshotHash).toBe(result.publishedVersion?.snapshotHash);
    expect(result.publishedVersion?.status).toBe("published");
    expect(result.publishedVersion?.immutable).toBe(true);
    expect(result.emittedEvents.map((event) => event.eventName)).toEqual([
      "settings.preview.generated",
      "settings.published"
    ]);
  });

  it("archives the previous published version when publishing a replacement", () => {
    const firstPublish = publishSettingsVersion({
      actorId: "owner-1",
      publishedAt: "2026-07-08T13:05:00.000Z",
      sourceVersion: draftVersion()
    });
    const replacement = publishSettingsVersion({
      actorId: "owner-2",
      existingVersions: firstPublish.versions,
      publishedAt: "2026-07-08T13:10:00.000Z",
      sourceVersion: draftVersion({
        card: {
          bio: "Updated operating leadership profile."
        }
      })
    });

    expect(replacement.ok).toBe(true);
    expect(replacement.archivedVersionId).toBe(firstPublish.publishedVersionId);
    expect(replacement.archivedVersion?.status).toBe("archived");
    expect(replacement.emittedEvents.map((event) => event.eventName)).toContain(
      "settings.version.archived"
    );
  });

  it("blocks publish and emits validation failure when required data is missing", () => {
    const result = publishSettingsVersion({
      actorId: "owner-1",
      publishedAt: "2026-07-08T13:05:00.000Z",
      sourceVersion: draftVersion({
        card: {
          executiveName: ""
        }
      })
    });

    expect(result.ok).toBe(false);
    expect(result.publishedVersionId).toBeNull();
    expect(result.emittedEvents.map((event) => event.eventName)).toContain(
      "settings.publish.validation_failed"
    );
    expect(result.validation.valid).toBe(false);
  });

  it("blocks publish when resolved brand tokens fail AA contrast", () => {
    const result = publishSettingsVersion({
      actorId: "owner-1",
      publishedAt: "2026-07-08T13:05:00.000Z",
      sourceVersion: draftVersion({
        tokens: {
          accessibility: {
            actionContrast: 1.2,
            contrastMode: "standard",
            fallbackApplied: false,
            minimumContrastRatio: 4.5,
            textOnBackgroundContrast: 1.1,
            wcagLevel: "below-aa"
          }
        }
      })
    });

    expect(result.ok).toBe(false);
    expect(result.validation.checks).toContainEqual(
      expect.objectContaining({
        checkId: "brand.snapshot.wcag_aa",
        passed: false,
        severity: "blocker"
      })
    );
  });

  it("returns non-blocking warnings when safe brand fallback was applied", () => {
    const result = publishSettingsVersion({
      actorId: "owner-1",
      publishedAt: "2026-07-08T13:05:00.000Z",
      sourceVersion: draftVersion({
        tokens: {
          accessibility: {
            actionContrast: 12.4,
            contrastMode: "standard",
            fallbackApplied: true,
            minimumContrastRatio: 4.5,
            textOnBackgroundContrast: 18.8,
            wcagLevel: "AA"
          },
          warnings: ["Fallback token applied."]
        }
      })
    });

    expect(result.ok).toBe(true);
    expect(result.warnings).toContain("Fallback token applied.");
    expect(result.warnings).toContain(
      "Resolved brand tokens used a safe fallback and should be reviewed."
    );
  });
});

