import type {
  CardSettingsVersion,
  SettingsPublishResult,
  SettingsPublishValidationCheck,
  SettingsPublishValidationResult,
  SettingsVersionEvent,
  SettingsVersionEventName
} from "@bidayax/types";
import {
  archivePublishedVersion,
  createSettingsStableHash,
  findCurrentPublishedVersion,
  generatePreviewVersion
} from "./settings-versioning";

export type PublishSettingsVersionInput = {
  readonly actorId: string;
  readonly existingVersions?: readonly CardSettingsVersion[];
  readonly publishedAt?: string;
  readonly sourceVersion: CardSettingsVersion;
};

function createdAtOrNow(createdAt?: string): string {
  return createdAt ?? new Date().toISOString();
}

function createEventId(
  eventName: SettingsVersionEventName,
  versionId: string | null,
  createdAt: string
): string {
  return `settings-event-${createSettingsStableHash({ createdAt, eventName, versionId })}`;
}

function createEvent(input: {
  readonly actorId: string;
  readonly cardId: string;
  readonly createdAt: string;
  readonly eventName: SettingsVersionEventName;
  readonly metadata?: Record<string, string | number | boolean | null>;
  readonly tenantId: string;
  readonly versionId: string | null;
}): SettingsVersionEvent {
  return {
    actorId: input.actorId,
    cardId: input.cardId,
    createdAt: input.createdAt,
    eventId: createEventId(input.eventName, input.versionId, input.createdAt),
    eventName: input.eventName,
    metadata: input.metadata ?? {},
    tenantId: input.tenantId,
    versionId: input.versionId
  };
}

function createCheck(
  checkId: string,
  passed: boolean,
  severity: SettingsPublishValidationCheck["severity"],
  message: string
): SettingsPublishValidationCheck {
  return {
    checkId,
    message,
    passed,
    severity
  };
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);

  for (const entry of Object.values(value as Record<string, unknown>)) {
    deepFreeze(entry);
  }

  return value;
}

export function validateSettingsForPublish(
  version: CardSettingsVersion
): SettingsPublishValidationResult {
  const { cardProfile, receptionistSettings, resolvedBrandTokens } =
    version.settingsSnapshot;
  const checks: SettingsPublishValidationCheck[] = [
    createCheck(
      "version.status.previewable",
      version.status === "draft" || version.status === "preview",
      "blocker",
      "Only draft or preview settings versions can be published."
    ),
    createCheck(
      "profile.executive_name.required",
      hasText(cardProfile.executiveName),
      "blocker",
      "Executive name is required before publish."
    ),
    createCheck(
      "profile.title.required",
      hasText(cardProfile.title),
      "blocker",
      "Executive title is required before publish."
    ),
    createCheck(
      "profile.company.required",
      hasText(cardProfile.company),
      "blocker",
      "Company name is required before publish."
    ),
    createCheck(
      "profile.email.required",
      hasText(cardProfile.email),
      "blocker",
      "Executive email is required before publish."
    ),
    createCheck(
      "profile.phone.required",
      hasText(cardProfile.phone),
      "blocker",
      "Executive phone is required before publish."
    ),
    createCheck(
      "profile.website.required",
      hasText(cardProfile.website),
      "blocker",
      "Executive website is required before publish."
    ),
    createCheck(
      "brand.snapshot.hash.required",
      hasText(resolvedBrandTokens.snapshotHash),
      "blocker",
      "Resolved brand tokens must include a snapshot hash."
    ),
    createCheck(
      "brand.snapshot.wcag_aa",
      resolvedBrandTokens.accessibility.wcagLevel === "AA",
      "blocker",
      "Resolved brand tokens must meet WCAG AA contrast before publish."
    ),
    createCheck(
      "snapshot.hash.matches.version",
      version.settingsSnapshot.snapshotHash === version.snapshotHash,
      "blocker",
      "Version snapshot hash must match the immutable settings snapshot."
    ),
    createCheck(
      "receptionist.consent.required",
      hasText(receptionistSettings.consentDisclosure),
      "blocker",
      "Receptionist consent disclosure is required before publish."
    ),
    createCheck(
      "receptionist.custom_greeting.valid",
      receptionistSettings.greetingMode !== "custom" ||
        hasText(receptionistSettings.customGreeting),
      "blocker",
      "Custom receptionist greeting cannot be empty when custom mode is selected."
    ),
    createCheck(
      "cta.primary.valid",
      !cardProfile.primaryCTA.visible ||
        (hasText(cardProfile.primaryCTA.label) &&
          hasText(cardProfile.primaryCTA.destination)),
      "blocker",
      "Visible primary CTA requires a label and destination."
    ),
    createCheck(
      "brand.snapshot.fallback_reviewed",
      !resolvedBrandTokens.accessibility.fallbackApplied,
      "warning",
      "Resolved brand tokens used a safe fallback and should be reviewed."
    )
  ];

  return {
    checks,
    valid: checks.every(
      (check) => check.severity !== "blocker" || check.passed
    )
  };
}

function createPublishedVersion(input: {
  readonly actorId: string;
  readonly createdAt: string;
  readonly previousVersionId: string | null;
  readonly sourceVersion: CardSettingsVersion;
}): CardSettingsVersion {
  const versionId = `settings-version-${createSettingsStableHash({
    createdAt: input.createdAt,
    previousVersionId: input.previousVersionId,
    snapshotHash: input.sourceVersion.snapshotHash,
    status: "published"
  })}`;

  return deepFreeze({
    ...input.sourceVersion,
    createdAt: input.createdAt,
    createdBy: input.actorId,
    immutable: true,
    previousVersionId: input.previousVersionId,
    status: "published" as const,
    versionId
  });
}

function collectWarnings(
  validation: SettingsPublishValidationResult,
  version: CardSettingsVersion
): readonly string[] {
  return [
    ...version.settingsSnapshot.resolvedBrandTokens.warnings,
    ...validation.checks
      .filter((check) => check.severity === "warning" && !check.passed)
      .map((check) => check.message)
  ];
}

export function publishSettingsVersion(
  input: PublishSettingsVersionInput
): SettingsPublishResult {
  const publishedAt = createdAtOrNow(input.publishedAt);
  const emittedEvents: SettingsVersionEvent[] = [];
  const existingVersions = input.existingVersions ?? [];
  let previewVersion = input.sourceVersion;

  if (input.sourceVersion.status === "draft") {
    const previewResult = generatePreviewVersion({
      actorId: input.actorId,
      createdAt: publishedAt,
      draftVersion: input.sourceVersion
    });
    previewVersion = previewResult.version;
    emittedEvents.push(...previewResult.emittedEvents);
  }

  const validation = validateSettingsForPublish(previewVersion);
  const warnings = collectWarnings(validation, previewVersion);

  if (!validation.valid) {
    emittedEvents.push(
      createEvent({
        actorId: input.actorId,
        cardId: previewVersion.cardId,
        createdAt: publishedAt,
        eventName: "settings.publish.validation_failed",
        metadata: {
          blockerCount: validation.checks.filter(
            (check) => check.severity === "blocker" && !check.passed
          ).length,
          snapshotHash: previewVersion.snapshotHash
        },
        tenantId: previewVersion.tenantId,
        versionId: previewVersion.versionId
      })
    );

    return {
      archivedVersion: null,
      archivedVersionId: null,
      emittedEvents,
      ok: false,
      publishedVersion: null,
      publishedVersionId: null,
      snapshotHash: null,
      validation,
      versions: [...existingVersions, previewVersion],
      warnings
    };
  }

  const previousPublishedVersion = findCurrentPublishedVersion(
    existingVersions,
    previewVersion.cardId,
    previewVersion.tenantId
  );
  const archivedResult = previousPublishedVersion
    ? archivePublishedVersion({
        actorId: input.actorId,
        createdAt: publishedAt,
        publishedVersion: previousPublishedVersion
      })
    : null;
  const publishedVersion = createPublishedVersion({
    actorId: input.actorId,
    createdAt: publishedAt,
    previousVersionId: archivedResult?.version.versionId ?? null,
    sourceVersion: previewVersion
  });

  if (archivedResult) {
    emittedEvents.push(...archivedResult.emittedEvents);
  }

  emittedEvents.push(
    createEvent({
      actorId: input.actorId,
      cardId: publishedVersion.cardId,
      createdAt: publishedAt,
      eventName: "settings.published",
      metadata: {
        archivedVersionId: archivedResult?.version.versionId ?? null,
        snapshotHash: publishedVersion.snapshotHash
      },
      tenantId: publishedVersion.tenantId,
      versionId: publishedVersion.versionId
    })
  );

  const replacedVersionIds = new Set<string>([
    ...(previousPublishedVersion ? [previousPublishedVersion.versionId] : []),
    previewVersion.versionId
  ]);
  const retainedVersions = existingVersions.filter(
    (version) => !replacedVersionIds.has(version.versionId)
  );
  const versions = [
    ...retainedVersions,
    previewVersion,
    ...(archivedResult ? [archivedResult.version] : []),
    publishedVersion
  ];

  return {
    archivedVersion: archivedResult?.version ?? null,
    archivedVersionId: archivedResult?.version.versionId ?? null,
    emittedEvents,
    ok: true,
    publishedVersion,
    publishedVersionId: publishedVersion.versionId,
    snapshotHash: publishedVersion.snapshotHash,
    validation,
    versions,
    warnings
  };
}
