import type {
  CanonicalManifestObject,
  CanonicalMigrationManifest,
  MigrationReconciliationResult,
  SchemaInventoryObject
} from "./types.js";

function makeKey(object: {
  objectType: string;
  schemaName: string;
  objectName: string;
  parentObject?: string;
}): string {
  return [object.objectType, object.schemaName, object.parentObject ?? "", object.objectName].join(":");
}

function objectsEquivalent(canonical: CanonicalManifestObject, live: SchemaInventoryObject): boolean {
  if (makeKey(canonical) !== makeKey(live)) {
    return false;
  }

  if (canonical.objectType === "comment") {
    const canonicalTarget = canonical.metadata.targetType;
    const liveTarget = live.metadata.targetType;
    return canonicalTarget === undefined || liveTarget === undefined || canonicalTarget === liveTarget;
  }

  return true;
}

export function reconcileMigration(
  manifest: CanonicalMigrationManifest,
  inventory: SchemaInventoryObject[],
  recordedMigrationIds: string[]
): MigrationReconciliationResult {
  const byKey = new Map(inventory.map((object) => [makeKey(object), object]));
  const evidence: string[] = [];
  let exactMatches = 0;
  let missingObjects = 0;
  let mismatchedObjects = 0;

  for (const object of manifest.objects) {
    const liveObject = byKey.get(makeKey(object));

    if (!liveObject) {
      missingObjects += 1;
      evidence.push(`${object.objectType} ${object.objectName} missing`);
      continue;
    }

    if (objectsEquivalent(object, liveObject)) {
      exactMatches += 1;
      continue;
    }

    mismatchedObjects += 1;
    evidence.push(`${object.objectType} ${object.objectName} differs from canonical expectation`);
  }

  const ledgerStatus = recordedMigrationIds.includes(manifest.migrationId)
    ? "RECORDED"
    : recordedMigrationIds.length > 0
      ? "NOT_RECORDED"
      : "UNKNOWN";

  const totalObjects = manifest.objects.length;
  const absent = exactMatches === 0 && missingObjects === totalObjects;
  const exact = exactMatches === totalObjects;
  const partial = missingObjects > 0 && (exactMatches > 0 || mismatchedObjects > 0);
  const drift = mismatchedObjects > 0 && missingObjects === 0;

  if (exact && ledgerStatus === "RECORDED") {
    return {
      migrationId: manifest.migrationId,
      ledgerStatus,
      schemaStatus: "EXACT",
      classification: "ALREADY_APPLIED_AND_RECORDED",
      recommendedAction: "MANUAL_REVIEW_REQUIRED",
      compatibilityRisk: "LOW",
      evidence: ["schema exactly matches canonical manifest", "migration already recorded"]
    };
  }

  if (exact) {
    return {
      migrationId: manifest.migrationId,
      ledgerStatus,
      schemaStatus: "EXACT",
      classification: "ALREADY_APPLIED_NOT_RECORDED",
      recommendedAction: "BASELINE_LEDGER_ONLY",
      compatibilityRisk: "LOW",
      evidence: ["schema exactly matches canonical manifest", "migration ledger entry missing or unknown"]
    };
  }

  if (partial) {
    return {
      migrationId: manifest.migrationId,
      ledgerStatus,
      schemaStatus: "PARTIAL",
      classification: "PARTIALLY_APPLIED",
      recommendedAction: "CREATE_CORRECTIVE_MIGRATION",
      compatibilityRisk: "HIGH",
      evidence
    };
  }

  if (drift) {
    return {
      migrationId: manifest.migrationId,
      ledgerStatus,
      schemaStatus: "DRIFT",
      classification: "SCHEMA_DRIFT",
      recommendedAction: "MANUAL_REVIEW_REQUIRED",
      compatibilityRisk: "CRITICAL",
      evidence
    };
  }

  if (absent) {
    return {
      migrationId: manifest.migrationId,
      ledgerStatus,
      schemaStatus: "ABSENT",
      classification: "NOT_APPLIED",
      recommendedAction: "ELIGIBLE_FOR_CONTROLLED_APPLICATION",
      compatibilityRisk: manifest.lockRiskClassification === "HIGH" ? "HIGH" : "MODERATE",
      evidence: ["no canonical objects found in live schema"]
    };
  }

  return {
    migrationId: manifest.migrationId,
    ledgerStatus,
    schemaStatus: "UNKNOWN",
    classification: "BLOCKED",
    recommendedAction: "BLOCK",
    compatibilityRisk: "CRITICAL",
    evidence: ["unable to determine reconciliation state"]
  };
}
