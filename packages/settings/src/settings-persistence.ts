import type {
  BrandAsset,
  CardSettingsVersion,
  ExecutiveCardProfile,
  ReceptionistSettings,
  SettingsAuditEvent,
  Tenant,
  TenantBrandProfile
} from "@bidayax/types";

export type SettingsQueryResult<Row> = {
  readonly rows: readonly Row[];
  readonly rowCount?: number | null;
};

export type SettingsQueryExecutor = {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[]
  ): Promise<SettingsQueryResult<Row>>;
};

export type SettingsIdempotencyRecord = {
  readonly cardId: string;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly idempotencyKey: string;
  readonly operation: string;
  readonly requestHash: string;
  readonly resultSnapshotHash: string | null;
  readonly resultVersionId: string | null;
  readonly tenantId: string;
};

export class SettingsPersistenceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsPersistenceConflictError";
  }
}

export type SettingsPersistenceRepository = {
  readonly saveTenant: (tenant: Tenant) => Promise<Tenant>;
  readonly getTenant: (tenantId: string) => Promise<Tenant | null>;
  readonly saveBrandAsset: (asset: BrandAsset) => Promise<BrandAsset>;
  readonly getBrandAsset: (
    tenantId: string,
    assetId: string
  ) => Promise<BrandAsset | null>;
  readonly saveTenantBrandProfile: (
    profile: TenantBrandProfile
  ) => Promise<TenantBrandProfile>;
  readonly getTenantBrandProfile: (
    tenantId: string
  ) => Promise<TenantBrandProfile | null>;
  readonly saveExecutiveCardProfile: (
    profile: ExecutiveCardProfile
  ) => Promise<ExecutiveCardProfile>;
  readonly getExecutiveCardProfile: (
    tenantId: string,
    cardId: string
  ) => Promise<ExecutiveCardProfile | null>;
  readonly saveReceptionistSettings: (
    settings: ReceptionistSettings
  ) => Promise<ReceptionistSettings>;
  readonly getReceptionistSettings: (
    tenantId: string
  ) => Promise<ReceptionistSettings | null>;
  readonly saveCardSettingsVersion: (
    version: CardSettingsVersion
  ) => Promise<CardSettingsVersion>;
  readonly archiveCardSettingsVersion: (
    version: CardSettingsVersion
  ) => Promise<CardSettingsVersion>;
  readonly getCardSettingsVersion: (
    tenantId: string,
    cardId: string,
    versionId: string
  ) => Promise<CardSettingsVersion | null>;
  readonly lockExecutiveCardForSettingsPublish: (
    tenantId: string,
    cardId: string
  ) => Promise<boolean>;
  readonly listCardSettingsVersions: (
    tenantId: string,
    cardId: string
  ) => Promise<readonly CardSettingsVersion[]>;
  readonly getPublishedCardSettingsVersion: (
    tenantId: string,
    cardId: string
  ) => Promise<CardSettingsVersion | null>;
  readonly saveSettingsAuditEvent: (
    event: SettingsAuditEvent
  ) => Promise<SettingsAuditEvent>;
  readonly getSettingsAuditEvent: (
    tenantId: string,
    cardId: string,
    eventId: string
  ) => Promise<SettingsAuditEvent | null>;
  readonly listSettingsAuditEvents: (
    tenantId: string,
    cardId: string
  ) => Promise<readonly SettingsAuditEvent[]>;
  readonly saveSettingsIdempotencyRecord: (
    record: SettingsIdempotencyRecord
  ) => Promise<SettingsIdempotencyRecord>;
  readonly getSettingsIdempotencyRecord: (
    tenantId: string,
    cardId: string,
    operation: string,
    idempotencyKey: string
  ) => Promise<SettingsIdempotencyRecord | null>;
};

type TenantRow = {
  readonly tenant_id: string;
  readonly company_name: string;
  readonly owner_email: string;
  readonly status: Tenant["status"];
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
};

type BrandAssetRow = {
  readonly asset_id: string;
  readonly tenant_id: string;
  readonly asset_type: BrandAsset["assetType"];
  readonly storage_path: string;
  readonly alt_text: string;
  readonly mime_type: string;
  readonly checksum_sha256: string;
  readonly created_at: string | Date;
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
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
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
  readonly created_at: string | Date;
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
  readonly occurred_at: string | Date;
  readonly source: SettingsAuditEvent["source"];
  readonly snapshot_hash: string | null;
  readonly previous_snapshot_hash: string | null;
  readonly metadata: SettingsAuditEvent["metadata"];
  readonly severity: SettingsAuditEvent["severity"];
};

type SettingsIdempotencyRecordRow = {
  readonly card_id: string;
  readonly created_at: string | Date;
  readonly expires_at: string | Date | null;
  readonly idempotency_key: string;
  readonly operation: string;
  readonly request_hash: string;
  readonly result_snapshot_hash: string | null;
  readonly result_version_id: string | null;
  readonly tenant_id: string;
};

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function firstRow<Row>(result: SettingsQueryResult<Row>): Row | null {
  return result.rows[0] ?? null;
}

function toJsonValue<T>(value: T): T {
  return value;
}

function mapTenant(row: TenantRow): Tenant {
  return {
    companyName: row.company_name,
    createdAt: toIsoString(row.created_at),
    ownerEmail: row.owner_email,
    status: row.status,
    tenantId: row.tenant_id,
    updatedAt: toIsoString(row.updated_at)
  };
}

function mapBrandAsset(row: BrandAssetRow): BrandAsset {
  return {
    altText: row.alt_text,
    assetId: row.asset_id,
    assetType: row.asset_type,
    checksumSha256: row.checksum_sha256,
    createdAt: toIsoString(row.created_at),
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    tenantId: row.tenant_id
  };
}

function mapTenantBrandProfile(row: TenantBrandProfileRow): TenantBrandProfile {
  return {
    accentColor: row.accent_color,
    backgroundColor: row.background_color,
    buttonRadius: row.button_radius,
    cardRadius: row.card_radius,
    companyName: row.company_name,
    contrastMode: row.contrast_mode,
    createdAt: toIsoString(row.created_at),
    faviconAssetId: row.favicon_asset_id,
    fontFamily: row.font_family,
    logoAssetId: row.logo_asset_id,
    motionIntensity: row.motion_intensity,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    tenantId: row.tenant_id,
    textColor: row.text_color,
    updatedAt: toIsoString(row.updated_at)
  };
}

function mapExecutiveCardProfile(row: ExecutiveCardProfileRow): ExecutiveCardProfile {
  return {
    bio: row.bio,
    calendarUrl: row.calendar_url,
    cardId: row.card_id,
    company: row.company,
    draftVersion: row.draft_version,
    email: row.email,
    executiveName: row.executive_name,
    location: row.location,
    phone: row.phone,
    primaryCTA: row.primary_cta,
    profileImageAssetId: row.profile_image_asset_id,
    publishedVersion: row.published_version,
    qrDestinationMode: row.qr_destination_mode,
    secondaryCTA: row.secondary_cta,
    socialLinks: row.social_links,
    status: row.status,
    tenantId: row.tenant_id,
    title: row.title,
    website: row.website
  };
}

function mapReceptionistSettings(row: ReceptionistSettingsRow): ReceptionistSettings {
  return {
    afterHoursBehavior: row.after_hours_behavior,
    appointmentRules: row.appointment_rules,
    callRoutingRules: row.call_routing_rules,
    consentDisclosure: row.consent_disclosure,
    customGreeting: row.custom_greeting,
    defaultLanguage: row.default_language,
    enabled: row.enabled,
    escalationContacts: row.escalation_contacts,
    fallbackBehavior: row.fallback_behavior,
    greetingMode: row.greeting_mode,
    mood: row.mood,
    recordingPolicy: row.recording_policy,
    standardGreeting: row.standard_greeting,
    supportedLanguages: row.supported_languages,
    tenantId: row.tenant_id,
    voiceProfile: row.voice_profile
  };
}

function mapCardSettingsVersion(row: CardSettingsVersionRow): CardSettingsVersion {
  return {
    cardId: row.card_id,
    createdAt: toIsoString(row.created_at),
    createdBy: row.created_by,
    immutable: row.immutable,
    previousVersionId: row.previous_version_id,
    settingsSnapshot: row.settings_snapshot,
    snapshotHash: row.snapshot_hash,
    status: row.status,
    tenantId: row.tenant_id,
    versionId: row.version_id
  };
}

function mapSettingsAuditEvent(row: SettingsAuditEventRow): SettingsAuditEvent {
  return {
    actor: row.actor,
    cardId: row.card_id,
    eventId: row.event_id,
    eventType: row.event_type,
    metadata: row.metadata,
    occurredAt: toIsoString(row.occurred_at),
    previousSnapshotHash: row.previous_snapshot_hash,
    severity: row.severity,
    snapshotHash: row.snapshot_hash,
    source: row.source,
    tenantId: row.tenant_id
  };
}

function mapSettingsIdempotencyRecord(
  row: SettingsIdempotencyRecordRow
): SettingsIdempotencyRecord {
  return {
    cardId: row.card_id,
    createdAt: toIsoString(row.created_at),
    expiresAt: row.expires_at ? toIsoString(row.expires_at) : null,
    idempotencyKey: row.idempotency_key,
    operation: row.operation,
    requestHash: row.request_hash,
    resultSnapshotHash: row.result_snapshot_hash,
    resultVersionId: row.result_version_id,
    tenantId: row.tenant_id
  };
}

function requireRow<Row>(result: SettingsQueryResult<Row>, message: string): Row {
  const row = firstRow(result);

  if (!row) {
    throw new SettingsPersistenceConflictError(message);
  }

  return row;
}

export function createSettingsPersistenceRepository(
  executor: SettingsQueryExecutor
): SettingsPersistenceRepository {
  return {
    async getBrandAsset(tenantId, assetId) {
      const result = await executor.query<BrandAssetRow>(
        "select * from brand_assets where tenant_id = $1 and asset_id = $2",
        [tenantId, assetId]
      );
      const row = firstRow(result);

      return row ? mapBrandAsset(row) : null;
    },

    async getExecutiveCardProfile(tenantId, cardId) {
      const result = await executor.query<ExecutiveCardProfileRow>(
        "select * from executive_card_profiles where tenant_id = $1 and card_id = $2",
        [tenantId, cardId]
      );
      const row = firstRow(result);

      return row ? mapExecutiveCardProfile(row) : null;
    },

    async getPublishedCardSettingsVersion(tenantId, cardId) {
      const result = await executor.query<CardSettingsVersionRow>(
        `select *
           from card_settings_versions
          where tenant_id = $1 and card_id = $2 and status = 'published'
          order by created_at desc
          limit 1`,
        [tenantId, cardId]
      );
      const row = firstRow(result);

      return row ? mapCardSettingsVersion(row) : null;
    },

    async getReceptionistSettings(tenantId) {
      const result = await executor.query<ReceptionistSettingsRow>(
        "select * from tenant_receptionist_settings where tenant_id = $1",
        [tenantId]
      );
      const row = firstRow(result);

      return row ? mapReceptionistSettings(row) : null;
    },

    async getCardSettingsVersion(tenantId, cardId, versionId) {
      const result = await executor.query<CardSettingsVersionRow>(
        `select *
           from card_settings_versions
          where tenant_id = $1 and card_id = $2 and version_id = $3`,
        [tenantId, cardId, versionId]
      );
      const row = firstRow(result);

      return row ? mapCardSettingsVersion(row) : null;
    },

    async getTenant(tenantId) {
      const result = await executor.query<TenantRow>(
        "select * from tenants where tenant_id = $1",
        [tenantId]
      );
      const row = firstRow(result);

      return row ? mapTenant(row) : null;
    },

    async getTenantBrandProfile(tenantId) {
      const result = await executor.query<TenantBrandProfileRow>(
        "select * from tenant_brand_profiles where tenant_id = $1",
        [tenantId]
      );
      const row = firstRow(result);

      return row ? mapTenantBrandProfile(row) : null;
    },

    async listCardSettingsVersions(tenantId, cardId) {
      const result = await executor.query<CardSettingsVersionRow>(
        `select *
           from card_settings_versions
          where tenant_id = $1 and card_id = $2
          order by created_at desc`,
        [tenantId, cardId]
      );

      return result.rows.map(mapCardSettingsVersion);
    },

    async listSettingsAuditEvents(tenantId, cardId) {
      const result = await executor.query<SettingsAuditEventRow>(
        `select *
           from settings_audit_events
          where tenant_id = $1 and card_id = $2
          order by occurred_at asc, event_id asc`,
        [tenantId, cardId]
      );

      return result.rows.map(mapSettingsAuditEvent);
    },

    async getSettingsAuditEvent(tenantId, cardId, eventId) {
      const result = await executor.query<SettingsAuditEventRow>(
        `select *
           from settings_audit_events
          where tenant_id = $1 and card_id = $2 and event_id = $3`,
        [tenantId, cardId, eventId]
      );
      const row = firstRow(result);

      return row ? mapSettingsAuditEvent(row) : null;
    },

    async getSettingsIdempotencyRecord(
      tenantId,
      cardId,
      operation,
      idempotencyKey
    ) {
      const result = await executor.query<SettingsIdempotencyRecordRow>(
        `select *
           from settings_idempotency_keys
          where tenant_id = $1
            and card_id = $2
            and operation = $3
            and idempotency_key = $4`,
        [tenantId, cardId, operation, idempotencyKey]
      );
      const row = firstRow(result);

      return row ? mapSettingsIdempotencyRecord(row) : null;
    },

    async lockExecutiveCardForSettingsPublish(tenantId, cardId) {
      const result = await executor.query<{ readonly card_id: string }>(
        `select card_id
           from executive_card_profiles
          where tenant_id = $1 and card_id = $2
          for update`,
        [tenantId, cardId]
      );

      return Boolean(firstRow(result));
    },

    async saveBrandAsset(asset) {
      const result = await executor.query<BrandAssetRow>(
        `insert into brand_assets (
           asset_id,
           tenant_id,
           asset_type,
           storage_path,
           alt_text,
           mime_type,
           checksum_sha256,
           created_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (asset_id) do update set
           asset_type = excluded.asset_type,
           storage_path = excluded.storage_path,
           alt_text = excluded.alt_text,
           mime_type = excluded.mime_type,
           checksum_sha256 = excluded.checksum_sha256,
           created_at = excluded.created_at
         where brand_assets.tenant_id = excluded.tenant_id
         returning *`,
        [
          asset.assetId,
          asset.tenantId,
          asset.assetType,
          asset.storagePath,
          asset.altText,
          asset.mimeType,
          asset.checksumSha256,
          asset.createdAt
        ]
      );

      return mapBrandAsset(
        requireRow(
          result,
          `Brand asset ${asset.assetId} belongs to a different tenant.`
        )
      );
    },

    async saveCardSettingsVersion(version) {
      const result = await executor.query<CardSettingsVersionRow>(
        `insert into card_settings_versions (
           version_id,
           card_id,
           tenant_id,
           settings_snapshot,
           created_by,
           created_at,
           status,
           snapshot_hash,
           immutable,
           previous_version_id
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (version_id) do nothing
         returning *`,
        [
          version.versionId,
          version.cardId,
          version.tenantId,
          toJsonValue(version.settingsSnapshot),
          version.createdBy,
          version.createdAt,
          version.status,
          version.snapshotHash,
          version.immutable,
          version.previousVersionId
        ]
      );

      const row = firstRow(result);

      if (row) {
        return mapCardSettingsVersion(row);
      }

      const existing = await this.getCardSettingsVersion(
        version.tenantId,
        version.cardId,
        version.versionId
      );

      if (
        existing &&
        existing.snapshotHash === version.snapshotHash &&
        existing.status === version.status
      ) {
        return existing;
      }

      throw new SettingsPersistenceConflictError(
        `Settings version ${version.versionId} already exists with different immutable content.`
      );
    },

    async archiveCardSettingsVersion(version) {
      const result = await executor.query<CardSettingsVersionRow>(
        `update card_settings_versions
            set status = 'archived',
                immutable = true
          where tenant_id = $1
            and card_id = $2
            and version_id = $3
            and status = 'published'
            and snapshot_hash = $4
          returning *`,
        [version.tenantId, version.cardId, version.versionId, version.snapshotHash]
      );

      return mapCardSettingsVersion(
        requireRow(
          result,
          `Published settings version ${version.versionId} could not be archived.`
        )
      );
    },

    async saveExecutiveCardProfile(profile) {
      const result = await executor.query<ExecutiveCardProfileRow>(
        `insert into executive_card_profiles (
           card_id,
           tenant_id,
           executive_name,
           title,
           company,
           bio,
           profile_image_asset_id,
           phone,
           email,
           website,
           calendar_url,
           location,
           social_links,
           primary_cta,
           secondary_cta,
           qr_destination_mode,
           published_version,
           draft_version,
           status
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15, $16, $17, $18, $19
         )
         on conflict (card_id) do update set
           executive_name = excluded.executive_name,
           title = excluded.title,
           company = excluded.company,
           bio = excluded.bio,
           profile_image_asset_id = excluded.profile_image_asset_id,
           phone = excluded.phone,
           email = excluded.email,
           website = excluded.website,
           calendar_url = excluded.calendar_url,
           location = excluded.location,
           social_links = excluded.social_links,
           primary_cta = excluded.primary_cta,
           secondary_cta = excluded.secondary_cta,
           qr_destination_mode = excluded.qr_destination_mode,
           published_version = excluded.published_version,
           draft_version = excluded.draft_version,
           status = excluded.status,
           updated_at = now()
         where executive_card_profiles.tenant_id = excluded.tenant_id
         returning *`,
        [
          profile.cardId,
          profile.tenantId,
          profile.executiveName,
          profile.title,
          profile.company,
          profile.bio,
          profile.profileImageAssetId,
          profile.phone,
          profile.email,
          profile.website,
          profile.calendarUrl,
          profile.location,
          toJsonValue(profile.socialLinks),
          toJsonValue(profile.primaryCTA),
          toJsonValue(profile.secondaryCTA),
          profile.qrDestinationMode,
          profile.publishedVersion,
          profile.draftVersion,
          profile.status
        ]
      );

      return mapExecutiveCardProfile(
        requireRow(
          result,
          `Card profile ${profile.cardId} belongs to a different tenant.`
        )
      );
    },

    async saveReceptionistSettings(settings) {
      const result = await executor.query<ReceptionistSettingsRow>(
        `insert into tenant_receptionist_settings (
           tenant_id,
           enabled,
           default_language,
           supported_languages,
           voice_profile,
           mood,
           greeting_mode,
           standard_greeting,
           custom_greeting,
           fallback_behavior,
           call_routing_rules,
           appointment_rules,
           after_hours_behavior,
           escalation_contacts,
           consent_disclosure,
           recording_policy
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13, $14, $15, $16
         )
         on conflict (tenant_id) do update set
           enabled = excluded.enabled,
           default_language = excluded.default_language,
           supported_languages = excluded.supported_languages,
           voice_profile = excluded.voice_profile,
           mood = excluded.mood,
           greeting_mode = excluded.greeting_mode,
           standard_greeting = excluded.standard_greeting,
           custom_greeting = excluded.custom_greeting,
           fallback_behavior = excluded.fallback_behavior,
           call_routing_rules = excluded.call_routing_rules,
           appointment_rules = excluded.appointment_rules,
           after_hours_behavior = excluded.after_hours_behavior,
           escalation_contacts = excluded.escalation_contacts,
           consent_disclosure = excluded.consent_disclosure,
           recording_policy = excluded.recording_policy,
           updated_at = now()
         returning *`,
        [
          settings.tenantId,
          settings.enabled,
          settings.defaultLanguage,
          toJsonValue(settings.supportedLanguages),
          settings.voiceProfile,
          settings.mood,
          settings.greetingMode,
          settings.standardGreeting,
          settings.customGreeting,
          settings.fallbackBehavior,
          toJsonValue(settings.callRoutingRules),
          toJsonValue(settings.appointmentRules),
          settings.afterHoursBehavior,
          toJsonValue(settings.escalationContacts),
          settings.consentDisclosure,
          settings.recordingPolicy
        ]
      );

      return mapReceptionistSettings(firstRow(result) as ReceptionistSettingsRow);
    },

    async saveSettingsAuditEvent(event) {
      const result = await executor.query<SettingsAuditEventRow>(
        `insert into settings_audit_events (
           event_id,
           event_type,
           tenant_id,
           card_id,
           actor,
           occurred_at,
           source,
           snapshot_hash,
           previous_snapshot_hash,
           metadata,
           severity
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         on conflict (event_id) do nothing
         returning *`,
        [
          event.eventId,
          event.eventType,
          event.tenantId,
          event.cardId,
          toJsonValue(event.actor),
          event.occurredAt,
          event.source,
          event.snapshotHash,
          event.previousSnapshotHash,
          toJsonValue(event.metadata),
          event.severity
        ]
      );

      const row = firstRow(result);

      if (row) {
        return mapSettingsAuditEvent(row);
      }

      const existing = await this.getSettingsAuditEvent(
        event.tenantId,
        event.cardId,
        event.eventId
      );

      if (existing) {
        return existing;
      }

      throw new SettingsPersistenceConflictError(
        `Audit event ${event.eventId} already exists for a different tenant or card.`
      );
    },

    async saveSettingsIdempotencyRecord(record) {
      const result = await executor.query<SettingsIdempotencyRecordRow>(
        `insert into settings_idempotency_keys (
           tenant_id,
           card_id,
           operation,
           idempotency_key,
           request_hash,
           result_version_id,
           result_snapshot_hash,
           created_at,
           expires_at
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (tenant_id, card_id, operation, idempotency_key) do update set
           result_version_id = settings_idempotency_keys.result_version_id,
           result_snapshot_hash = settings_idempotency_keys.result_snapshot_hash
         where settings_idempotency_keys.request_hash = excluded.request_hash
         returning *`,
        [
          record.tenantId,
          record.cardId,
          record.operation,
          record.idempotencyKey,
          record.requestHash,
          record.resultVersionId,
          record.resultSnapshotHash,
          record.createdAt,
          record.expiresAt
        ]
      );

      return mapSettingsIdempotencyRecord(
        requireRow(
          result,
          `Idempotency key ${record.idempotencyKey} was already used with a different request.`
        )
      );
    },

    async saveTenant(tenant) {
      const result = await executor.query<TenantRow>(
        `insert into tenants (
           tenant_id,
           company_name,
           owner_email,
           status,
           created_at,
           updated_at
         ) values ($1, $2, $3, $4, $5, $6)
         on conflict (tenant_id) do update set
           company_name = excluded.company_name,
           owner_email = excluded.owner_email,
           status = excluded.status,
           updated_at = excluded.updated_at
         returning *`,
        [
          tenant.tenantId,
          tenant.companyName,
          tenant.ownerEmail,
          tenant.status,
          tenant.createdAt,
          tenant.updatedAt
        ]
      );

      return mapTenant(firstRow(result) as TenantRow);
    },

    async saveTenantBrandProfile(profile) {
      const result = await executor.query<TenantBrandProfileRow>(
        `insert into tenant_brand_profiles (
           tenant_id,
           company_name,
           logo_asset_id,
           favicon_asset_id,
           primary_color,
           secondary_color,
           accent_color,
           background_color,
           text_color,
           font_family,
           button_radius,
           card_radius,
           motion_intensity,
           contrast_mode,
           created_at,
           updated_at
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13, $14, $15, $16
         )
         on conflict (tenant_id) do update set
           company_name = excluded.company_name,
           logo_asset_id = excluded.logo_asset_id,
           favicon_asset_id = excluded.favicon_asset_id,
           primary_color = excluded.primary_color,
           secondary_color = excluded.secondary_color,
           accent_color = excluded.accent_color,
           background_color = excluded.background_color,
           text_color = excluded.text_color,
           font_family = excluded.font_family,
           button_radius = excluded.button_radius,
           card_radius = excluded.card_radius,
           motion_intensity = excluded.motion_intensity,
           contrast_mode = excluded.contrast_mode,
           updated_at = excluded.updated_at
         returning *`,
        [
          profile.tenantId,
          profile.companyName,
          profile.logoAssetId,
          profile.faviconAssetId,
          profile.primaryColor,
          profile.secondaryColor,
          profile.accentColor,
          profile.backgroundColor,
          profile.textColor,
          profile.fontFamily,
          profile.buttonRadius,
          profile.cardRadius,
          profile.motionIntensity,
          profile.contrastMode,
          profile.createdAt,
          profile.updatedAt
        ]
      );

      return mapTenantBrandProfile(firstRow(result) as TenantBrandProfileRow);
    }
  };
}
