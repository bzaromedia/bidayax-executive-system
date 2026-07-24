import { stableJson } from "./hash.ts";
import { buildSchemaDefinitionHash } from "./schema-definition-hash.ts";
import { normalizeSchemaObject } from "./schema-normalization.ts";
import type {
  CanonicalManifestObject,
  CanonicalMigrationManifest,
  MigrationReconciliationResult,
  SchemaDefinitionObjectType,
  SchemaInventoryObject
} from "./types.ts";

const tableScopedObjectTypes = new Set<SchemaDefinitionObjectType>([
  "column",
  "primary_key",
  "foreign_key",
  "unique_constraint",
  "check_constraint",
  "index",
  "trigger",
  "policy",
  "comment",
  "row_level_security"
]);

type ObjectComparisonResult = "EXACT" | "MISMATCHED" | "UNKNOWN";

function makeKey(object: {
  objectType: string;
  schemaName: string;
  objectName: string;
  parentObject?: string;
}): string {
  return [object.objectType, object.schemaName, object.parentObject ?? "", object.objectName].join(":");
}

function hasBooleanValue(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function hasStringValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasArrayValues(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "string" && entry.length > 0);
}

function hasDefinitionEvidence(object: CanonicalManifestObject | SchemaInventoryObject): boolean {
  const metadata = normalizeSchemaObject(object).metadata;

  switch (object.objectType) {
    case "table":
      return hasArrayValues(metadata.columns);
    case "column":
      return hasStringValue(metadata.dataType) && hasBooleanValue(metadata.isNullable);
    case "primary_key":
    case "unique_constraint":
      return hasArrayValues(metadata.columns);
    case "foreign_key":
      return (
        hasArrayValues(metadata.columns) &&
        hasStringValue(metadata.referencedTable) &&
        hasArrayValues(metadata.referencedColumns)
      );
    case "check_constraint":
      return hasStringValue(metadata.expression);
    case "index":
      return hasArrayValues(metadata.columns) && hasStringValue(metadata.method) && hasBooleanValue(metadata.unique);
    case "trigger":
      return (
        hasStringValue(metadata.actionTiming) &&
        hasBooleanValue(metadata.enabled) &&
        hasArrayValues(metadata.eventManipulation) &&
        hasStringValue(metadata.functionName) &&
        hasStringValue(metadata.level)
      );
    case "function":
      return (
        hasStringValue(metadata.bodyHash) &&
        hasStringValue(metadata.language) &&
        hasStringValue(metadata.returnType) &&
        hasBooleanValue(metadata.securityDefiner) &&
        hasBooleanValue(metadata.strict) &&
        hasBooleanValue(metadata.leakproof) &&
        hasStringValue(metadata.volatility)
      );
    case "sequence":
      return (
        hasStringValue(metadata.dataType) &&
        metadata.increment !== null &&
        metadata.maximumValue !== null &&
        metadata.minimumValue !== null &&
        metadata.startValue !== null
      );
    case "policy":
      return (
        hasStringValue(metadata.command) &&
        hasBooleanValue(metadata.permissive) &&
        hasStringValue(metadata.qualifierHash) &&
        hasStringValue(metadata.rolesHash) &&
        hasStringValue(metadata.withCheckHash)
      );
    case "extension":
      return hasStringValue(metadata.name);
    case "comment":
      return hasStringValue(metadata.targetType) && hasStringValue(metadata.commentHash);
    case "row_level_security":
      return hasBooleanValue(metadata.rowSecurity) && hasBooleanValue(metadata.forceRowSecurity);
    default:
      return false;
  }
}

function compareObjects(canonical: CanonicalManifestObject, live: SchemaInventoryObject): ObjectComparisonResult {
  if (makeKey(canonical) !== makeKey(live)) {
    return "MISMATCHED";
  }

  if (!hasDefinitionEvidence(canonical) || !hasDefinitionEvidence(live)) {
    return "UNKNOWN";
  }

  const normalizedCanonical = normalizeSchemaObject(canonical);
  const normalizedLive = normalizeSchemaObject(live);

  const identicalDefinition =
    stableJson(normalizedCanonical) === stableJson(normalizedLive) &&
    buildSchemaDefinitionHash(canonical) === buildSchemaDefinitionHash(live);

  return identicalDefinition ? "EXACT" : "MISMATCHED";
}

function collectCanonicalTables(manifest: CanonicalMigrationManifest): Set<string> {
  const tables = new Set<string>();

  for (const object of manifest.objects) {
    if (object.objectType === "table") {
      tables.add(object.objectName);
    }

    const tableName = getTableScopeName(object);
    if (tableName) {
      tables.add(tableName);
    }
  }

  return tables;
}

function getTableScopeName(object: {
  objectType: SchemaDefinitionObjectType;
  objectName: string;
  parentObject?: string;
}): string | null {
  if (!tableScopedObjectTypes.has(object.objectType)) {
    return null;
  }

  if (object.parentObject) {
    return object.parentObject;
  }

  if (object.objectType === "comment" || object.objectType === "row_level_security") {
    return object.objectName;
  }

  return null;
}

function isWithinCanonicalScope(object: SchemaInventoryObject, canonicalTables: Set<string>): boolean {
  const tableName = getTableScopeName(object);
  return tableName !== null && canonicalTables.has(tableName);
}

export function reconcileMigration(
  manifest: CanonicalMigrationManifest,
  inventory: SchemaInventoryObject[],
  recordedMigrationIds: string[],
  knownCanonicalObjects: CanonicalManifestObject[] = manifest.objects
): MigrationReconciliationResult {
  const byKey = new Map(inventory.map((object) => [makeKey(object), object]));
  const manifestKeys = new Set(manifest.objects.map((object) => makeKey(object)));
  const knownCanonicalKeys = new Set(knownCanonicalObjects.map((object) => makeKey(object)));
  const canonicalTables = collectCanonicalTables(manifest);
  const evidence: string[] = [];
  let exactMatches = 0;
  let missingObjects = 0;
  let mismatchedObjects = 0;
  let unknownObjects = 0;
  let extraScopedObjects = 0;

  for (const object of manifest.objects) {
    const liveObject = byKey.get(makeKey(object));

    if (!liveObject) {
      missingObjects += 1;
      evidence.push(`${object.objectType} ${object.objectName} missing`);
      continue;
    }

    const comparison = compareObjects(object, liveObject);
    if (comparison === "EXACT") {
      exactMatches += 1;
      continue;
    }

    if (comparison === "UNKNOWN") {
      unknownObjects += 1;
      evidence.push(`${object.objectType} ${object.objectName} lacks sufficient definition evidence for safe equivalence`);
      continue;
    }

    mismatchedObjects += 1;
    evidence.push(`${object.objectType} ${object.objectName} differs from canonical expectation`);
  }

  for (const liveObject of inventory) {
    if (manifestKeys.has(makeKey(liveObject)) || knownCanonicalKeys.has(makeKey(liveObject))) {
      continue;
    }

    if (!isWithinCanonicalScope(liveObject, canonicalTables)) {
      continue;
    }

    extraScopedObjects += 1;
    evidence.push(`${liveObject.objectType} ${liveObject.objectName} is unexpectedly present in canonical scope`);
  }

  const ledgerStatus = recordedMigrationIds.includes(manifest.migrationId)
    ? "RECORDED"
    : recordedMigrationIds.length > 0
      ? "NOT_RECORDED"
      : "UNKNOWN";

  const totalObjects = manifest.objects.length;
  const exact =
    exactMatches === totalObjects &&
    mismatchedObjects === 0 &&
    missingObjects === 0 &&
    extraScopedObjects === 0 &&
    unknownObjects === 0;
  const absent = exactMatches === 0 && missingObjects === totalObjects && mismatchedObjects === 0 && extraScopedObjects === 0;
  const partial = missingObjects > 0 && !absent;
  const drift = missingObjects === 0 && unknownObjects === 0 && (mismatchedObjects > 0 || extraScopedObjects > 0);

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

  if (unknownObjects > 0) {
    return {
      migrationId: manifest.migrationId,
      ledgerStatus,
      schemaStatus: "UNKNOWN",
      classification: "BLOCKED",
      recommendedAction: "BLOCK",
      compatibilityRisk: "CRITICAL",
      evidence
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
    evidence: evidence.length > 0 ? evidence : ["unable to determine reconciliation state"]
  };
}
