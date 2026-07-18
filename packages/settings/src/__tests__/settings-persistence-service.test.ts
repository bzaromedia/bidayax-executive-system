import { describe, expect, it } from "vitest";
import { generateKeyPairSync, sign as nodeSign } from "node:crypto";
import type { TrustKey } from "@bidayax/trust";
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
  persistIdempotentSettingsPublishResult,
  persistSettingsPublishResult,
  persistSettingsPublishResultTransactionally,
  persistSettingsSnapshot
} from "../settings-persistence-service";
import { persistTrustedSettingsPublishTransactionally } from "../settings-trust-publish";
import type {
  SettingsIdempotencyRecord,
  SettingsPersistenceRepository,
  SettingsQueryExecutor,
  SettingsQueryResult
} from "../settings-persistence";

const createdAt = "2026-07-09T12:00:00.000Z";

class RecordingRepository implements SettingsPersistenceRepository {
  readonly calls: string[] = [];

  async archiveCardSettingsVersion(version: CardSettingsVersion) {
    this.calls.push(`archive:${version.versionId}`);
    return { ...version, immutable: true, status: "archived" as const };
  }

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

  async getSettingsAuditEvent() {
    return null;
  }

  async getSettingsIdempotencyRecord(): Promise<SettingsIdempotencyRecord | null> {
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

  async lockExecutiveCardForSettingsPublish() {
    this.calls.push("lock:card-ad-garner");
    return true;
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

  async saveSettingsIdempotencyRecord(record: SettingsIdempotencyRecord) {
    this.calls.push(`idempotency:${record.idempotencyKey}`);
    return record;
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

class RetryRecordingRepository extends RecordingRepository {
  constructor(private readonly existing: SettingsIdempotencyRecord) {
    super();
  }

  override async getSettingsIdempotencyRecord() {
    this.calls.push(`idempotency-read:${this.existing.idempotencyKey}`);
    return this.existing;
  }
}

class FailingTransactionExecutor implements SettingsQueryExecutor {
  readonly statements: string[] = [];

  async query<Row>(
    text: string,
    values: readonly unknown[] = []
  ): Promise<SettingsQueryResult<Row>> {
    this.statements.push(text);
    const normalized = text.toLowerCase();

    if (
      normalized === "begin" ||
      normalized === "commit" ||
      normalized === "rollback"
    ) {
      return { rowCount: 0, rows: [] };
    }

    if (normalized.includes("select card_id")) {
      return { rowCount: 1, rows: [{ card_id: "card-ad-garner" } as Row] };
    }

    if (normalized.includes("insert into card_settings_versions")) {
      return {
        rowCount: 1,
        rows: [
          {
            card_id: values[1],
            created_at: values[5],
            created_by: values[4],
            immutable: values[8],
            previous_version_id: values[9],
            settings_snapshot: values[3],
            snapshot_hash: values[7],
            status: values[6],
            tenant_id: values[2],
            version_id: values[0]
          } as Row
        ]
      };
    }

    if (normalized.includes("insert into settings_audit_events")) {
      throw new Error("forced audit failure");
    }

    return { rowCount: 0, rows: [] };
  }
}

class SuccessfulTrustTransactionExecutor extends FailingTransactionExecutor {
  override async query<Row>(text: string, values: readonly unknown[] = []): Promise<SettingsQueryResult<Row>> {
    const normalized = text.toLowerCase();
    if (normalized.includes("from trust_audit_chain_entries")) { this.statements.push(text); return { rowCount: 0, rows: [] }; }
    if (normalized.includes("insert into settings_audit_events")) { this.statements.push(text); return { rowCount: 1, rows: [{ actor: values[4], card_id: values[3], event_id: values[0], event_type: values[1], metadata: values[9], occurred_at: values[5], previous_snapshot_hash: values[8], severity: values[10], snapshot_hash: values[7], source: values[6], tenant_id: values[2] } as Row] }; }
    if (normalized.includes("insert into trust_") || normalized.includes("insert into cryptographic_envelopes")) { this.statements.push(text); return { rowCount: 1, rows: [] }; }
    return super.query(text, values);
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

function publishResult(overrides: Partial<SettingsPublishResult> = {}) {
  return {
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
    versions: [version("version-preview", "preview"), version("version-published", "published")],
    warnings: [],
    ...overrides
  } satisfies SettingsPublishResult;
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
    const result = await persistSettingsPublishResult({
      publishResult: publishResult(),
      repository
    });

    expect(result).toEqual({
      auditEventCount: 1,
      persistedVersionIds: ["version-preview", "version-published"]
    });
    expect(repository.calls).toEqual([
      "lock:card-ad-garner",
      "version:version-preview",
      "version:version-published",
      "audit:audit-1"
    ]);
  });

  it("archives the previous published version before inserting a replacement", async () => {
    const repository = new RecordingRepository();
    const archived = version("version-old", "archived");
    const result = await persistSettingsPublishResult({
      publishResult: publishResult({
        archivedVersion: archived,
        archivedVersionId: "version-old",
        auditEvents: [auditEvent("audit-archive")],
        publishedVersion: version("version-new", "published"),
        publishedVersionId: "version-new",
        versions: [archived, version("version-new", "published")]
      }),
      repository
    });

    expect(result.persistedVersionIds).toEqual(["version-old", "version-new"]);
    expect(repository.calls).toEqual([
      "lock:card-ad-garner",
      "archive:version-old",
      "version:version-new",
      "audit:audit-archive"
    ]);
  });

  it("records idempotency for publish retries", async () => {
    const repository = new RecordingRepository();
    const result = await persistIdempotentSettingsPublishResult({
      createdAt,
      idempotencyKey: "request-1",
      publishResult: publishResult({
        auditEvents: [auditEvent("audit-idempotent")],
        versions: [version("version-published", "published")]
      }),
      repository,
      requestHash: "request-hash"
    });

    expect(result.reusedExistingResult).toBe(false);
    expect(repository.calls).toEqual([
      "lock:card-ad-garner",
      "version:version-published",
      "audit:audit-idempotent",
      "idempotency:request-1"
    ]);
  });

  it("returns the original idempotent publish result for a safe retry", async () => {
    const repository = new RetryRecordingRepository({
      cardId: "card-ad-garner",
      createdAt,
      expiresAt: null,
      idempotencyKey: "request-1",
      operation: "settings.publish",
      requestHash: "request-hash",
      resultSnapshotHash: "snapshot-hash",
      resultVersionId: "version-published",
      tenantId: "tenant-bidayax"
    });
    const result = await persistIdempotentSettingsPublishResult({
      createdAt,
      idempotencyKey: "request-1",
      publishResult: publishResult(),
      repository,
      requestHash: "request-hash"
    });

    expect(result.reusedExistingResult).toBe(true);
    expect(result.persistedVersionIds).toEqual(["version-published"]);
    expect(repository.calls).toEqual(["idempotency-read:request-1"]);
  });

  it("rolls back transactional publish persistence when a step fails", async () => {
    const executor = new FailingTransactionExecutor();

    await expect(
      persistSettingsPublishResultTransactionally({
        executor,
        publishResult: publishResult({
          auditEvents: [auditEvent("audit-fail")],
          versions: [version("version-published", "published")]
        })
      })
    ).rejects.toThrow("forced audit failure");
    expect(executor.statements).toContain("begin");
    expect(executor.statements).toContain("rollback");
    expect(executor.statements).not.toContain("commit");
  });

  it("fails closed and rolls back before settings persistence when required signing dependencies are absent", async () => {
    const executor = new FailingTransactionExecutor();
    await expect(persistTrustedSettingsPublishTransactionally({
      evidenceRequired: true,
      executor,
      idempotencyKey: "publish-trust-1",
      publishedAt: createdAt,
      publishResult: publishResult(),
      signing: null
    })).rejects.toThrow("Required settings trust evidence");
    expect(executor.statements).toEqual(["begin", "rollback"]);
  });

  it("commits settings and all required trust evidence through one transaction", async () => {
    const executor = new SuccessfulTrustTransactionExecutor();
    const pair = generateKeyPairSync("ed25519");
    const key: TrustKey = { algorithm: "Ed25519", compromisedAt: null, createdAt, identityId: "owner-1", keyId: "settings-key-1", keyVersion: 1, metadata: {}, providerKeyReference: "opaque-test-reference", providerType: "remote-signer", publicKey: pair.publicKey.export({ format: "der", type: "spki" }).toString("base64url"), publicKeyEncoding: "spki-der-base64url", purpose: "settings_signing", replacesKeyId: null, replacesKeyVersion: null, revokedAt: null, scopeId: "card-ad-garner", status: "active", statusChangedAt: createdAt, structureVersion: "1", tenantId: "tenant-bidayax", validFrom: createdAt, validUntil: null };
    const result = await persistSettingsPublishResultTransactionally({ executor, publishResult: publishResult(), trust: { evidenceRequired: true, idempotencyKey: "publish-trust-atomic-1", publishedAt: createdAt, signing: { key, provider: { async sign(input) { return nodeSign(null, input.data, pair.privateKey); } }, signerId: key.identityId, signerType: "tenant" } } });
    expect(result.persistedVersionIds).toContain("version-published");
    expect(executor.statements.at(0)).toBe("begin"); expect(executor.statements.at(-1)).toBe("commit");
    for (const table of ["trust_provenance_manifests", "cryptographic_envelopes", "trust_events", "trust_audit_chain_entries"]) expect(executor.statements.some((statement) => statement.includes(`insert into ${table}`))).toBe(true);
    expect(publishResult().snapshotHash).toBe("snapshot-hash");
  });
});
