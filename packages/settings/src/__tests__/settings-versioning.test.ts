import { describe, expect, it } from "vitest";
import { primitiveColors } from "@bidayax/tokens";
import type {
  ExecutiveCardProfile,
  ReceptionistSettings,
  ResolvedBrandTokens,
  TenantBrandProfile
} from "@bidayax/types";
import {
  archivePublishedVersion,
  createCardSettingsSnapshot,
  createSettingsDraft,
  findCurrentPublishedVersion,
  generatePreviewVersion
} from "../settings-versioning";

const createdAt = "2026-07-08T12:00:00.000Z";

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

function resolvedTokens(): ResolvedBrandTokens {
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
    warnings: []
  };
}

function cardProfile(): ExecutiveCardProfile {
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
    website: "https://theexecutivecard.online"
  };
}

function receptionistSettings(): ReceptionistSettings {
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
    voiceProfile: "professional"
  };
}

function settingsSnapshot() {
  return createCardSettingsSnapshot({
    brandProfile: brandProfile(),
    cardProfile: cardProfile(),
    generatedAt: createdAt,
    receptionistSettings: receptionistSettings(),
    resolvedBrandTokens: resolvedTokens()
  });
}

describe("settings versioning", () => {
  it("creates an immutable settings snapshot with a content hash", () => {
    const snapshot = settingsSnapshot();

    expect(snapshot.snapshotHash).toMatch(/^settings-fnv1a-/);
    expect(snapshot.generatedAt).toBe(createdAt);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("saves edits as a draft and emits a draft event", () => {
    const result = createSettingsDraft({
      actorId: "owner-1",
      createdAt,
      settingsSnapshot: settingsSnapshot()
    });

    expect(result.version.status).toBe("draft");
    expect(result.version.immutable).toBe(false);
    expect(result.emittedEvents).toHaveLength(1);
    expect(result.emittedEvents[0]?.eventName).toBe("settings.draft.created");
  });

  it("generates a preview version from a draft", () => {
    const draft = createSettingsDraft({
      actorId: "owner-1",
      createdAt,
      settingsSnapshot: settingsSnapshot()
    }).version;
    const result = generatePreviewVersion({
      actorId: "owner-1",
      createdAt: "2026-07-08T12:05:00.000Z",
      draftVersion: draft
    });

    expect(result.version.status).toBe("preview");
    expect(result.version.snapshotHash).toBe(draft.snapshotHash);
    expect(result.emittedEvents.map((event) => event.eventName)).toEqual([
      "settings.preview.generated",
      "receptionist.settings.previewed"
    ]);
  });

  it("archives a published version without mutating the original", () => {
    const draft = createSettingsDraft({
      actorId: "owner-1",
      createdAt,
      settingsSnapshot: settingsSnapshot()
    }).version;
    const published = {
      ...draft,
      immutable: true,
      status: "published" as const
    };
    const result = archivePublishedVersion({
      actorId: "owner-2",
      createdAt: "2026-07-08T12:10:00.000Z",
      publishedVersion: published
    });

    expect(published.status).toBe("published");
    expect(result.version.status).toBe("archived");
    expect(result.version.immutable).toBe(true);
    expect(result.emittedEvents[0]?.eventName).toBe("settings.version.archived");
  });

  it("finds the current published version for a card and tenant", () => {
    const draft = createSettingsDraft({
      actorId: "owner-1",
      createdAt,
      settingsSnapshot: settingsSnapshot()
    }).version;
    const published = {
      ...draft,
      status: "published" as const
    };

    expect(
      findCurrentPublishedVersion(
        [draft, published],
        "card-ad-garner",
        "tenant-bidayax"
      )?.versionId
    ).toBe(published.versionId);
  });
});

