import { describe, expect, it } from "vitest";
import { primitiveColors } from "@bidayax/tokens";
import type {
  BrandAsset,
  CardSettingsVersion,
  ExecutiveCardProfile,
  ReceptionistSettings,
  SettingsAuditEvent,
  Tenant,
  TenantBrandProfile
} from "@bidayax/types";
import {
  SettingsPersistenceConflictError,
  createSettingsPersistenceRepository
} from "../settings-persistence";
import type {
  SettingsQueryExecutor,
  SettingsQueryResult
} from "../settings-persistence";

const createdAt = "2026-07-09T10:00:00.000Z";

type StoredRows = {
  auditEvents: SettingsAuditEventRow[];
  assets: BrandAssetRow[];
  idempotencyRecords: SettingsIdempotencyRecordRow[];
  cardProfiles: ExecutiveCardProfileRow[];
  receptionistSettings: ReceptionistSettingsRow[];
  tenants: TenantRow[];
  tenantBrandProfiles: TenantBrandProfileRow[];
  versions: CardSettingsVersionRow[];
};

type TenantRow = {
  readonly tenant_id: string;
  readonly company_name: string;
  readonly owner_email: string;
  readonly status: Tenant["status"];
  readonly created_at: string;
  readonly updated_at: string;
};

type BrandAssetRow = {
  readonly asset_id: string;
  readonly tenant_id: string;
  readonly asset_type: BrandAsset["assetType"];
  readonly storage_path: string;
  readonly alt_text: string;
  readonly mime_type: string;
  readonly checksum_sha256: string;
  readonly created_at: string;
};

type TenantBrandProfileRow = {
  readonly tenant_id: string;
  readonly company_name: string;
  readonly logo_asset_id: string;
  readonly favicon_asset_id: string;
  readonly primary_color: string;
  readonly secondary_color: string;
  readonly accent_color: string;
  readonly background_color: string;
  readonly text_color: string;
  readonly font_family: string;
  readonly button_radius: string;
  readonly card_radius: string;
  readonly motion_intensity: TenantBrandProfile["motionIntensity"];
  readonly contrast_mode: TenantBrandProfile["contrastMode"];
  readonly created_at: string;
  readonly updated_at: string;
};

type ExecutiveCardProfileRow = {
  readonly card_id: string;
  readonly tenant_id: string;
  readonly executive_name: string;
  readonly title: string;
  readonly company: string;
  readonly bio: string;
  readonly profile_image_asset_id: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly calendar_url: string;
  readonly location: string;
  readonly social_links: ExecutiveCardProfile["socialLinks"];
  readonly primary_cta: ExecutiveCardProfile["primaryCTA"];
  readonly secondary_cta: ExecutiveCardProfile["secondaryCTA"];
  readonly qr_destination_mode: ExecutiveCardProfile["qrDestinationMode"];
  readonly published_version: string | null;
  readonly draft_version: string | null;
  readonly status: ExecutiveCardProfile["status"];
};

type ReceptionistSettingsRow = {
  readonly tenant_id: string;
  readonly enabled: boolean;
  readonly default_language: ReceptionistSettings["defaultLanguage"];
  readonly supported_languages: ReceptionistSettings["supportedLanguages"];
  readonly voice_profile: ReceptionistSettings["voiceProfile"];
  readonly mood: ReceptionistSettings["mood"];
  readonly greeting_mode: ReceptionistSettings["greetingMode"];
  readonly standard_greeting: string;
  readonly custom_greeting: string | null;
  readonly fallback_behavior: ReceptionistSettings["fallbackBehavior"];
  readonly call_routing_rules: ReceptionistSettings["callRoutingRules"];
  readonly appointment_rules: ReceptionistSettings["appointmentRules"];
  readonly after_hours_behavior: ReceptionistSettings["afterHoursBehavior"];
  readonly escalation_contacts: ReceptionistSettings["escalationContacts"];
  readonly consent_disclosure: string;
  readonly recording_policy: ReceptionistSettings["recordingPolicy"];
};

type CardSettingsVersionRow = {
  readonly version_id: string;
  readonly card_id: string;
  readonly tenant_id: string;
  readonly settings_snapshot: CardSettingsVersion["settingsSnapshot"];
  readonly created_by: string;
  readonly created_at: string;
  readonly status: CardSettingsVersion["status"];
  readonly snapshot_hash: string;
  readonly immutable: boolean;
  readonly previous_version_id: string | null;
};

type SettingsAuditEventRow = {
  readonly event_id: string;
  readonly event_type: SettingsAuditEvent["eventType"];
  readonly tenant_id: string;
  readonly card_id: string;
  readonly actor: SettingsAuditEvent["actor"];
  readonly occurred_at: string;
  readonly source: SettingsAuditEvent["source"];
  readonly snapshot_hash: string | null;
  readonly previous_snapshot_hash: string | null;
  readonly metadata: SettingsAuditEvent["metadata"];
  readonly severity: SettingsAuditEvent["severity"];
};

type SettingsIdempotencyRecordRow = {
  readonly card_id: string;
  readonly created_at: string;
  readonly expires_at: string | null;
  readonly idempotency_key: string;
  readonly operation: string;
  readonly request_hash: string;
  readonly result_snapshot_hash: string | null;
  readonly result_version_id: string | null;
  readonly tenant_id: string;
};

class FakeSettingsExecutor implements SettingsQueryExecutor {
  readonly statements: string[] = [];
  readonly rows: StoredRows = {
    auditEvents: [],
    assets: [],
    cardProfiles: [],
    idempotencyRecords: [],
    receptionistSettings: [],
    tenantBrandProfiles: [],
    tenants: [],
    versions: []
  };

  async query<Row>(
    text: string,
    values: readonly unknown[] = []
  ): Promise<SettingsQueryResult<Row>> {
    this.statements.push(text);
    const normalized = text.toLowerCase();

    if (normalized.includes("insert into tenants")) {
      const row = {
        company_name: values[1],
        created_at: values[4],
        owner_email: values[2],
        status: values[3],
        tenant_id: values[0],
        updated_at: values[5]
      } as TenantRow;
      this.rows.tenants = upsert(
        this.rows.tenants,
        row,
        (entry) => entry.tenant_id
      );
      return one<Row>(row);
    }

    if (normalized.includes("select * from tenants")) {
      return many<Row>(
        this.rows.tenants.filter((row) => row.tenant_id === values[0])
      );
    }

    if (normalized.includes("insert into brand_assets")) {
      const existing = this.rows.assets.find(
        (row) => row.asset_id === values[0] && row.tenant_id !== values[1]
      );

      if (existing) {
        return many<Row>([]);
      }

      const row = {
        alt_text: values[4],
        asset_id: values[0],
        asset_type: values[2],
        checksum_sha256: values[6],
        created_at: values[7],
        mime_type: values[5],
        storage_path: values[3],
        tenant_id: values[1]
      } as BrandAssetRow;
      this.rows.assets = upsert(this.rows.assets, row, (entry) => entry.asset_id);
      return one<Row>(row);
    }

    if (normalized.includes("select * from brand_assets")) {
      return many<Row>(
        this.rows.assets.filter(
          (row) => row.tenant_id === values[0] && row.asset_id === values[1]
        )
      );
    }

    if (normalized.includes("insert into tenant_brand_profiles")) {
      const row = {
        accent_color: values[6],
        background_color: values[7],
        button_radius: values[10],
        card_radius: values[11],
        company_name: values[1],
        contrast_mode: values[13],
        created_at: values[14],
        favicon_asset_id: values[3],
        font_family: values[9],
        logo_asset_id: values[2],
        motion_intensity: values[12],
        primary_color: values[4],
        secondary_color: values[5],
        tenant_id: values[0],
        text_color: values[8],
        updated_at: values[15]
      } as TenantBrandProfileRow;
      this.rows.tenantBrandProfiles = upsert(
        this.rows.tenantBrandProfiles,
        row,
        (entry) => entry.tenant_id
      );
      return one<Row>(row);
    }

    if (normalized.includes("select * from tenant_brand_profiles")) {
      return many<Row>(
        this.rows.tenantBrandProfiles.filter((row) => row.tenant_id === values[0])
      );
    }

    if (normalized.includes("insert into executive_card_profiles")) {
      const existing = this.rows.cardProfiles.find(
        (row) => row.card_id === values[0] && row.tenant_id !== values[1]
      );

      if (existing) {
        return many<Row>([]);
      }

      const row = {
        bio: values[5],
        calendar_url: values[10],
        card_id: values[0],
        company: values[4],
        draft_version: values[17],
        email: values[8],
        executive_name: values[2],
        location: values[11],
        phone: values[7],
        primary_cta: values[13],
        profile_image_asset_id: values[6],
        published_version: values[16],
        qr_destination_mode: values[15],
        secondary_cta: values[14],
        social_links: values[12],
        status: values[18],
        tenant_id: values[1],
        title: values[3],
        website: values[9]
      } as ExecutiveCardProfileRow;
      this.rows.cardProfiles = upsert(
        this.rows.cardProfiles,
        row,
        (entry) => entry.card_id
      );
      return one<Row>(row);
    }

    if (normalized.includes("select * from executive_card_profiles")) {
      return many<Row>(
        this.rows.cardProfiles.filter(
          (row) => row.tenant_id === values[0] && row.card_id === values[1]
        )
      );
    }

    if (normalized.includes("insert into tenant_receptionist_settings")) {
      const row = {
        after_hours_behavior: values[12],
        appointment_rules: values[11],
        call_routing_rules: values[10],
        consent_disclosure: values[14],
        custom_greeting: values[8],
        default_language: values[2],
        enabled: values[1],
        escalation_contacts: values[13],
        fallback_behavior: values[9],
        greeting_mode: values[6],
        mood: values[5],
        recording_policy: values[15],
        standard_greeting: values[7],
        supported_languages: values[3],
        tenant_id: values[0],
        voice_profile: values[4]
      } as ReceptionistSettingsRow;
      this.rows.receptionistSettings = upsert(
        this.rows.receptionistSettings,
        row,
        (entry) => entry.tenant_id
      );
      return one<Row>(row);
    }

    if (normalized.includes("select * from tenant_receptionist_settings")) {
      return many<Row>(
        this.rows.receptionistSettings.filter(
          (row) => row.tenant_id === values[0]
        )
      );
    }

    if (normalized.includes("insert into card_settings_versions")) {
      const existing = this.rows.versions.find(
        (row) => row.version_id === values[0]
      );

      if (existing) {
        return many<Row>([]);
      }

      const row = {
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
      } as CardSettingsVersionRow;
      this.rows.versions = upsert(
        this.rows.versions,
        row,
        (entry) => entry.version_id
      );
      return one<Row>(row);
    }

        if (normalized.includes("update card_settings_versions")) {
      const row = this.rows.versions.find(
        (entry) =>
          entry.tenant_id === values[0] &&
          entry.card_id === values[1] &&
          entry.version_id === values[2] &&
          entry.status === "published" &&
          entry.snapshot_hash === values[3]
      );

      if (!row) {
        return many<Row>([]);
      }

      const archived = { ...row, immutable: true, status: "archived" } as CardSettingsVersionRow;
      this.rows.versions = upsert(
        this.rows.versions,
        archived,
        (entry) => entry.version_id
      );

      return one<Row>(archived);
    }

    if (normalized.includes("select card_id")) {
      return many<Row>(
        this.rows.cardProfiles.filter(
          (row) => row.tenant_id === values[0] && row.card_id === values[1]
        )
      );
    }

    if (normalized.includes("status = 'published'")) {
      return many<Row>(
        this.rows.versions.filter(
          (row) =>
            row.tenant_id === values[0] &&
            row.card_id === values[1] &&
            row.status === "published"
        )
      );
    }

    if (normalized.includes("from card_settings_versions")) {
      return many<Row>(
        this.rows.versions.filter((row) =>
          values.length === 3
            ? row.tenant_id === values[0] &&
              row.card_id === values[1] &&
              row.version_id === values[2]
            : row.tenant_id === values[0] && row.card_id === values[1]
        )
      );
    }

    if (normalized.includes("insert into settings_audit_events")) {
      const existing = this.rows.auditEvents.find(
        (row) => row.event_id === values[0]
      );

      if (existing) {
        return many<Row>([]);
      }

      const row = {
        actor: values[4],
        card_id: values[3],
        event_id: values[0],
        event_type: values[1],
        metadata: values[9],
        occurred_at: values[5],
        previous_snapshot_hash: values[8],
        severity: values[10],
        snapshot_hash: values[7],
        source: values[6],
        tenant_id: values[2]
      } as SettingsAuditEventRow;
      this.rows.auditEvents = upsert(
        this.rows.auditEvents,
        row,
        (entry) => entry.event_id
      );
      return one<Row>(row);
    }

    if (normalized.includes("from settings_audit_events")) {
      return many<Row>(
        this.rows.auditEvents.filter(
          (row) =>
            row.tenant_id === values[0] &&
            row.card_id === values[1] &&
            (values.length < 3 || row.event_id === values[2])
        )
      );
    }

    if (normalized.includes("insert into settings_idempotency_keys")) {
      const existing = this.rows.idempotencyRecords.find(
        (row) =>
          row.tenant_id === values[0] &&
          row.card_id === values[1] &&
          row.operation === values[2] &&
          row.idempotency_key === values[3]
      );

      if (existing && existing.request_hash !== values[4]) {
        return many<Row>([]);
      }

      if (existing) {
        return one<Row>(existing);
      }

      const row = {
        card_id: values[1],
        created_at: values[7],
        expires_at: values[8],
        idempotency_key: values[3],
        operation: values[2],
        request_hash: values[4],
        result_snapshot_hash: values[6],
        result_version_id: values[5],
        tenant_id: values[0]
      } as SettingsIdempotencyRecordRow;
      this.rows.idempotencyRecords = [...this.rows.idempotencyRecords, row];

      return one<Row>(row);
    }

    if (normalized.includes("from settings_idempotency_keys")) {
      return many<Row>(
        this.rows.idempotencyRecords.filter(
          (row) =>
            row.tenant_id === values[0] &&
            row.card_id === values[1] &&
            row.operation === values[2] &&
            row.idempotency_key === values[3]
        )
      );
    }

    return many<Row>([]);
  }
}

function one<Row>(row: unknown): SettingsQueryResult<Row> {
  return {
    rowCount: 1,
    rows: [row as Row]
  };
}

function many<Row>(rows: readonly unknown[]): SettingsQueryResult<Row> {
  return {
    rowCount: rows.length,
    rows: rows as readonly Row[]
  };
}

function upsert<Row>(
  rows: readonly Row[],
  next: Row,
  getKey: (row: Row) => string
): Row[] {
  return [...rows.filter((row) => getKey(row) !== getKey(next)), next];
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

function brandProfile(): TenantBrandProfile {
  return {
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
  };
}

function cardProfile(): ExecutiveCardProfile {
  return {
    bio: "Executive identity and operations leadership.",
    calendarUrl: "https://theexecutivecard.online/card/ad-garner/calendar",
    cardId: "card-ad-garner",
    company: "BidayaX LLC",
    draftVersion: "version-draft",
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
    socialLinks: [
      {
        label: "Website",
        platform: "web",
        url: "https://theexecutivecard.online",
        visible: true
      }
    ],
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

function cardSettingsVersion(): CardSettingsVersion {
  return {
    cardId: "card-ad-garner",
    createdAt,
    createdBy: "owner-1",
    immutable: false,
    previousVersionId: null,
    settingsSnapshot: {
      brandProfile: brandProfile(),
      cardProfile: cardProfile(),
      generatedAt: createdAt,
      receptionistSettings: receptionistSettings(),
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
    },
    snapshotHash: "snapshot-hash",
    status: "draft",
    tenantId: "tenant-bidayax",
    versionId: "version-draft"
  };
}

function auditEvent(): SettingsAuditEvent {
  return {
    actor: {
      actorId: "owner-1",
      actorType: "user",
      displayName: "Owner"
    },
    cardId: "card-ad-garner",
    eventId: "event-1",
    eventType: "settings.draft.created",
    metadata: {
      status: "draft"
    },
    occurredAt: createdAt,
    previousSnapshotHash: null,
    severity: "info",
    snapshotHash: "snapshot-hash",
    source: "settings-versioning",
    tenantId: "tenant-bidayax"
  };
}

describe("settings persistence repository", () => {
  it("saves and reads tenant, brand, card, receptionist, version, and audit rows", async () => {
    const executor = new FakeSettingsExecutor();
    const repository = createSettingsPersistenceRepository(executor);
    const savedTenant = await repository.saveTenant(tenant());
    const savedAsset = await repository.saveBrandAsset({
      altText: "Logo",
      assetId: "asset-logo",
      assetType: "logo",
      checksumSha256: "sha256-test",
      createdAt,
      mimeType: "image/svg+xml",
      storagePath: "/uploads/logos/logo.svg",
      tenantId: "tenant-bidayax"
    });
    const savedBrand = await repository.saveTenantBrandProfile(brandProfile());
    const savedCard = await repository.saveExecutiveCardProfile(cardProfile());
    const savedReceptionist =
      await repository.saveReceptionistSettings(receptionistSettings());
    const savedVersion =
      await repository.saveCardSettingsVersion(cardSettingsVersion());
    const savedAudit = await repository.saveSettingsAuditEvent(auditEvent());

    expect(savedTenant.tenantId).toBe("tenant-bidayax");
    expect(savedAsset.assetType).toBe("logo");
    expect(savedBrand.primaryColor).toBe(primitiveColors.gold.brand);
    expect(savedCard.socialLinks[0]?.url).toBe("https://theexecutivecard.online");
    expect(savedReceptionist.supportedLanguages).toEqual(["English", "Spanish"]);
    expect(savedVersion.settingsSnapshot.snapshotHash).toBe("snapshot-hash");
    expect(savedAudit.metadata.status).toBe("draft");

    await expect(repository.getTenant("tenant-bidayax")).resolves.toEqual(savedTenant);
    await expect(
      repository.getBrandAsset("tenant-bidayax", "asset-logo")
    ).resolves.toEqual(savedAsset);
    await expect(repository.getTenantBrandProfile("tenant-bidayax")).resolves.toEqual(
      savedBrand
    );
    await expect(
      repository.getExecutiveCardProfile("tenant-bidayax", "card-ad-garner")
    ).resolves.toEqual(savedCard);
    await expect(repository.getReceptionistSettings("tenant-bidayax")).resolves.toEqual(
      savedReceptionist
    );
    await expect(
      repository.getCardSettingsVersion(
        "tenant-bidayax",
        "card-ad-garner",
        "version-draft"
      )
    ).resolves.toEqual(savedVersion);
    await expect(
      repository.listSettingsAuditEvents("tenant-bidayax", "card-ad-garner")
    ).resolves.toEqual([savedAudit]);
  });



  it("denies cross-tenant reads and updates by scoped ownership", async () => {
    const executor = new FakeSettingsExecutor();
    const repository = createSettingsPersistenceRepository(executor);

    await repository.saveBrandAsset({
      altText: "Logo",
      assetId: "asset-logo",
      assetType: "logo",
      checksumSha256: "sha256-test",
      createdAt,
      mimeType: "image/svg+xml",
      storagePath: "/uploads/logos/logo.svg",
      tenantId: "tenant-bidayax"
    });
    await repository.saveExecutiveCardProfile(cardProfile());
    await repository.saveCardSettingsVersion(cardSettingsVersion());

    await expect(
      repository.getBrandAsset("tenant-other", "asset-logo")
    ).resolves.toBeNull();
    await expect(
      repository.getExecutiveCardProfile("tenant-other", "card-ad-garner")
    ).resolves.toBeNull();
    await expect(
      repository.getCardSettingsVersion(
        "tenant-other",
        "card-ad-garner",
        "version-draft"
      )
    ).resolves.toBeNull();
    await expect(
      repository.saveBrandAsset({
        altText: "Other",
        assetId: "asset-logo",
        assetType: "logo",
        checksumSha256: "sha256-other",
        createdAt,
        mimeType: "image/svg+xml",
        storagePath: "/uploads/logos/other.svg",
        tenantId: "tenant-other"
      })
    ).rejects.toBeInstanceOf(SettingsPersistenceConflictError);
  });

  it("keeps audit events append-only and safely deduplicated", async () => {
    const executor = new FakeSettingsExecutor();
    const repository = createSettingsPersistenceRepository(executor);
    const first = await repository.saveSettingsAuditEvent(auditEvent());
    const duplicate = await repository.saveSettingsAuditEvent({
      ...auditEvent(),
      metadata: { status: "mutated" },
      severity: "critical"
    });

    expect(duplicate).toEqual(first);
    await expect(
      repository.listSettingsAuditEvents("tenant-bidayax", "card-ad-garner")
    ).resolves.toEqual([first]);
  });

  it("archives published versions without mutating snapshot content", async () => {
    const executor = new FakeSettingsExecutor();
    const repository = createSettingsPersistenceRepository(executor);
    const published = {
      ...cardSettingsVersion(),
      immutable: true,
      status: "published" as const,
      versionId: "version-published"
    };

    await repository.saveCardSettingsVersion(published);
    const archived = await repository.archiveCardSettingsVersion({
      ...published,
      status: "archived"
    });

    expect(archived.status).toBe("archived");
    expect(archived.snapshotHash).toBe(published.snapshotHash);
    expect(archived.settingsSnapshot).toEqual(published.settingsSnapshot);
  });

  it("stores idempotency records and rejects key reuse with different content", async () => {
    const executor = new FakeSettingsExecutor();
    const repository = createSettingsPersistenceRepository(executor);
    const record = {
      cardId: "card-ad-garner",
      createdAt,
      expiresAt: null,
      idempotencyKey: "request-1",
      operation: "settings.publish",
      requestHash: "request-hash",
      resultSnapshotHash: "snapshot-hash",
      resultVersionId: "version-published",
      tenantId: "tenant-bidayax"
    };

    await expect(repository.saveSettingsIdempotencyRecord(record)).resolves.toEqual(
      record
    );
    await expect(
      repository.getSettingsIdempotencyRecord(
        "tenant-bidayax",
        "card-ad-garner",
        "settings.publish",
        "request-1"
      )
    ).resolves.toEqual(record);
    await expect(
      repository.saveSettingsIdempotencyRecord({
        ...record,
        requestHash: "different-hash"
      })
    ).rejects.toBeInstanceOf(SettingsPersistenceConflictError);
  });

  it("uses Phase 3 persistence tables without touching provider tables", async () => {
    const executor = new FakeSettingsExecutor();
    const repository = createSettingsPersistenceRepository(executor);

    await repository.saveReceptionistSettings(receptionistSettings());
    await repository.getPublishedCardSettingsVersion(
      "tenant-bidayax",
      "card-ad-garner"
    );

    expect(executor.statements.join("\n")).toContain(
      "tenant_receptionist_settings"
    );
    expect(executor.statements.join("\n")).toContain("card_settings_versions");
    expect(executor.statements.join("\n")).not.toMatch(
      /twilio|telnyx|vapi|retell|bland/i
    );
  });
});
