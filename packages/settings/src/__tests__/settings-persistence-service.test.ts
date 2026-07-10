import { describe, expect, it } from "vitest";
import { primitiveColors } from "@bidayax/tokens";
import type {
  BrandAsset,
  CardSettingsSnapshot,
  CardSettingsVersion,
  SettingsAuditEvent,
  SettingsPublishResult,
  Tenant
} from "@bidayax/types";
import {
  persistSettingsPublishResult,
  persistSettingsSnapshot
} from "../settings-persistence-service";
import type { SettingsPersistenceRepository } from "../settings-persistence";

const createdAt = "2026-07-09T12:00:00.000Z";

class RecordingRepository implements SettingsPersistenceRepository {
  readonly calls: string[] = [];

  async getBrandAsset() {
    return null;
  }

  async getCardSettingsVersion() {
    return null;
  }

  async getExecutiveCardProfile() {
    return null;
  }

  async getPublishedCardSettingsVersion() {
    return null;
  }

  async getReceptionistSettings() {
    return null;
  }

  async getTenant() {
    return null;
  }

  async getTenantBrandProfile() {
    return null;
  }

  async listCardSettingsVersions() {
    return [];
  }

  async listSettingsAuditEvents() {
    return [];
  }

  async saveBrandAsset(asset: BrandAsset) {
    this.calls.push(`asset:${asset.assetId}`);
    return asset;
  }

  async saveCardSettingsVersion(version: CardSettingsVersion) {
    this.calls.push(`version:${version.versionId}`);
    return version;
  }

  async saveExecutiveCardProfile(profile: CardSettingsSnapshot["cardProfile"]) {
    this.calls.push(`card:${profile.cardId}`);
    return profile;
  }

  async saveReceptionistSettings(
    settings: CardSettingsSnapshot["receptionistSettings"]
  ) {
    this.calls.push(`receptionist:${settings.tenantId}`);
    return settings;
  }

  async saveSettingsAuditEvent(event: SettingsAuditEvent) {
    this.calls.push(`audit:${event.eventId}`);
    return event;
  }

  async saveTenant(tenant: Tenant) {
    this.calls.push(`tenant:${tenant.tenantId}`);
    return tenant;
  }

  async saveTenantBrandProfile(profile: CardSettingsSnapshot["brandProfile"]) {
    this.calls.push(`brand:${profile.tenantId}`);
    return profile;
  }
}

function tenant(): Tenant {
  return {
    companyName: "BidayaX LLC",
    createdAt,
    ownerEmail: "owner@theexecutivecard.online",
    status: "active",
    tenantId: "tenant-bidayax",
    updatedAt: createdAt
  };
}

function snapshot(): CardSettingsSnapshot {
  return {
    brandProfile: {
      accentColor: primitiveColors.gold.brand,
      backgroundColor: primitiveColors.black.brand,
      buttonRadius: "8px",
      cardRadius: "12px",
      companyName: "BidayaX LLC",
      contrastMode: "standard",
      createdAt,
      faviconAssetId: "asset-mark",
      fontFamily: "Inter",
      logoAssetId: "asset-logo",
      motionIntensity: "standard",
      primaryColor: primitiveColors.gold.brand,
      secondaryColor: primitiveColors.charcoal.brand,
      tenantId: "tenant-bidayax",
      textColor: primitiveColors.neutral.pureWhite,
      updatedAt: createdAt
    },
    cardProfile: {
      bio: "Executive identity and operations leadership.",
      calendarUrl: "https://theexecutivecard.online/card/ad-garner/calendar",
      cardId: "card-ad-garner",
      company: "BidayaX LLC",
      draftVersion: null,
      email: "contact@theexecutivecard.online",
      executiveName: "A.D Garner",
      location: "8 The Green Ste A, Dover, DE 19901",
      phone: "+1 (302) 330-5547",
      primaryCTA: {
        destination: "tel:+13023305547",
        label: "Call",
        type: "call",
        visible: true
      },
      profileImageAssetId: "asset-avatar",
      publishedVersion: null,
      qrDestinationMode: "card_profile",
      secondaryCTA: {
        destination: "mailto:contact@theexecutivecard.online",
        label: "Email",
        type: "email",
        visible: true
      },
      socialLinks: [],
      status: "draft",
      tenantId: "tenant-bidayax",
      title: "COO / CTO / Founder",
      website: "https://theexecutivecard.online"
    },
    generatedAt: createdAt,
    receptionistSettings: {
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
    },
    resolvedBrandTokens: {
      accessibility: {
        actionContrast: 12,
        contrastMode: "standard",
        fallbackApplied: false,
        minimumContrastRatio: 4.5,
        textOnBackgroundContrast: 18,
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
        buttonRadius: "8px",
        cardRadius: "12px"
      },
      resolverVersion: "2.0.0-phase-2b",
      snapshotHash: "token-hash",
      sourceBrandProfileId: "tenant-bidayax",
      tenantId: "tenant-bidayax",
      typography: {
        bodyFont: "Inter",
        displayFont: "Playfair Display",
        fontFamily: "Inter"
      },
      warnings: []
    },
    snapshotHash: "snapshot-hash"
  };
}

function version(versionId: string, status: CardSettingsVersion["status"]) {
  return {
    cardId: "card-ad-garner",
    createdAt,
    createdBy: "owner-1",
    immutable: status === "published" || status === "archived",
    previousVersionId: null,
    settingsSnapshot: snapshot(),
    snapshotHash: "snapshot-hash",
    status,
    tenantId: "tenant-bidayax",
    versionId
  } satisfies CardSettingsVersion;
}

function auditEvent(eventId: string): SettingsAuditEvent {
  return {
    actor: {
      actorId: "owner-1",
      actorType: "user",
      displayName: "Owner"
    },
    cardId: "card-ad-garner",
    eventId,
    eventType: "settings.published",
    metadata: {
      status: "published"
    },
    occurredAt: createdAt,
    previousSnapshotHash: null,
    severity: "info",
    snapshotHash: "snapshot-hash",
    source: "settings-publish",
    tenantId: "tenant-bidayax"
  };
}

describe("settings persistence service", () => {
  it("persists a snapshot before live publish storage exists", async () => {
    const repository = new RecordingRepository();
    const result = await persistSettingsSnapshot({
      assets: [
        {
          altText: "Logo",
          assetId: "asset-logo",
          assetType: "logo",
          checksumSha256: "sha256-test",
          createdAt,
          mimeType: "image/svg+xml",
          storagePath: "/uploads/logos/logo.svg",
          tenantId: "tenant-bidayax"
        }
      ],
      repository,
      snapshot: snapshot(),
      tenant: tenant()
    });

    expect(result).toEqual({
      assetCount: 1,
      cardId: "card-ad-garner",
      tenantId: "tenant-bidayax"
    });
    expect(repository.calls).toEqual([
      "tenant:tenant-bidayax",
      "asset:asset-logo",
      "brand:tenant-bidayax",
      "card:card-ad-garner",
      "receptionist:tenant-bidayax"
    ]);
  });

  it("persists publish versions and audit events", async () => {
    const repository = new RecordingRepository();
    const publishResult = {
      archivedVersion: null,
      archivedVersionId: null,
      auditEvents: [auditEvent("audit-1")],
      emittedEvents: [],
      ok: true,
      publishedVersion: version("version-published", "published"),
      publishedVersionId: "version-published",
      snapshotHash: "snapshot-hash",
      validation: {
        checks: [],
        valid: true
      },
      versions: [
        version("version-preview", "preview"),
        version("version-published", "published")
      ],
      warnings: []
    } satisfies SettingsPublishResult;

    const result = await persistSettingsPublishResult({
      publishResult,
      repository
    });

    expect(result).toEqual({
      auditEventCount: 1,
      persistedVersionIds: ["version-preview", "version-published"]
    });
    expect(repository.calls).toEqual([
      "version:version-preview",
      "version:version-published",
      "audit:audit-1"
    ]);
  });
});


