import { readFileSync } from "node:fs";

import { definitionHash, sha256 } from "./hash.js";
import type { CanonicalManifestObject, CanonicalMigrationManifest } from "./types.js";

const manualMetadata: Record<
  string,
  Pick<
    CanonicalMigrationManifest,
    "expectedDependencies" | "expectedOrdering" | "potentiallyDestructiveOperations" | "lockRiskClassification" | "rollbackLimitations"
  >
> = {
  "0014": {
    expectedDependencies: ["tenants", "executive_card_profiles"],
    expectedOrdering: ["tenants", "brand_assets", "tenant_brand_profiles", "executive_card_profiles"],
    potentiallyDestructiveOperations: ["DROP TRIGGER IF EXISTS"],
    lockRiskClassification: "MODERATE",
    rollbackLimitations: ["settings snapshots are immutable once published or archived"]
  },
  "0015": {
    expectedDependencies: ["tenants", "executive_card_profiles"],
    expectedOrdering: ["user_identities", "identity_provider_accounts", "tenant_memberships", "application_sessions"],
    potentiallyDestructiveOperations: ["DROP TRIGGER IF EXISTS"],
    lockRiskClassification: "MODERATE",
    rollbackLimitations: ["identity session and audit evidence are append-only"]
  },
  "0016": {
    expectedDependencies: ["tenants", "executive_card_profiles"],
    expectedOrdering: ["telephony_phone_numbers", "telephony_call_sessions", "telephony_usage_ledger"],
    potentiallyDestructiveOperations: ["DROP TRIGGER IF EXISTS"],
    lockRiskClassification: "HIGH",
    rollbackLimitations: ["telephony usage and audit evidence are append-only"]
  },
  "0017": {
    expectedDependencies: ["tenants", "executive_card_profiles"],
    expectedOrdering: ["trust_algorithm_registry", "trust_crypto_identities", "trust_keys", "cryptographic_envelopes"],
    potentiallyDestructiveOperations: ["DROP TRIGGER IF EXISTS", "INSERT INTO trust_algorithm_registry"],
    lockRiskClassification: "HIGH",
    rollbackLimitations: ["trust evidence, merkle proofs, and audit chains are immutable or append-only"]
  }
};

function extractMatches(sql: string, expression: RegExp): string[] {
  return Array.from(sql.matchAll(expression), (match) => match[1]).filter((value): value is string => Boolean(value)).sort();
}

function extractTables(sql: string): CanonicalManifestObject[] {
  const matches = Array.from(
    sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);\n?/g)
  );

  return matches.flatMap((match) => {
    const tableName = match[1];
    const body = match[2];
    if (!tableName || !body) {
      return [];
    }

    const lines = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const columns = lines
      .filter(
        (line) =>
          !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b/i.test(line) &&
          /^[a-zA-Z0-9_]+/.test(line)
      )
      .map((line) => line.match(/^([a-zA-Z0-9_]+)/)?.[1])
      .filter((value): value is string => Boolean(value));

    const tableObject: CanonicalManifestObject = {
      objectType: "table",
      schemaName: "public",
      objectName: tableName,
      definitionHash: definitionHash({ tableName, columns, sql: body }),
      metadata: { columns }
    };

    const columnObjects: CanonicalManifestObject[] = columns.map((columnName) => ({
      objectType: "column",
      schemaName: "public",
      objectName: columnName,
      parentObject: tableName,
      definitionHash: definitionHash({ tableName, columnName }),
      metadata: {}
    }));

    return [tableObject, ...columnObjects];
  });
}

function extractIndexes(sql: string): CanonicalManifestObject[] {
  return Array.from(
    sql.matchAll(/CREATE (?:UNIQUE )?INDEX IF NOT EXISTS\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)/g)
  ).flatMap((match) => {
    const indexName = match[1];
    const tableName = match[2];
    if (!indexName || !tableName) {
      return [];
    }

    return [{
      objectType: "index" as const,
      schemaName: "public",
      objectName: indexName,
      parentObject: tableName,
      definitionHash: definitionHash({ indexName, tableName }),
      metadata: {}
    }];
  });
}

function extractTriggers(sql: string): CanonicalManifestObject[] {
  return Array.from(sql.matchAll(/CREATE TRIGGER\s+([a-zA-Z0-9_]+)[\s\S]*?\s+ON\s+([a-zA-Z0-9_]+)/g)).flatMap((match) => {
    const triggerName = match[1];
    const tableName = match[2];
    if (!triggerName || !tableName) {
      return [];
    }

    return [{
      objectType: "trigger" as const,
      schemaName: "public",
      objectName: triggerName,
      parentObject: tableName,
      definitionHash: definitionHash({ triggerName, tableName }),
      metadata: {}
    }];
  });
}

function extractFunctions(sql: string): CanonicalManifestObject[] {
  return extractMatches(sql, /CREATE OR REPLACE FUNCTION\s+([a-zA-Z0-9_]+)/g).map((functionName) => ({
    objectType: "function",
    schemaName: "public",
    objectName: functionName,
    definitionHash: definitionHash(functionName),
    metadata: {}
  }));
}

function extractComments(sql: string): CanonicalManifestObject[] {
  return extractMatches(sql, /COMMENT ON TABLE\s+([a-zA-Z0-9_]+)/g).map((tableName) => ({
    objectType: "comment",
    schemaName: "public",
    objectName: tableName,
    definitionHash: definitionHash(tableName),
    metadata: { targetType: "table" }
  }));
}

function extractExtensions(sql: string): CanonicalManifestObject[] {
  return extractMatches(sql, /CREATE EXTENSION IF NOT EXISTS\s+([a-zA-Z0-9_]+)/g).map((extensionName) => ({
    objectType: "extension",
    schemaName: "public",
    objectName: extensionName,
    definitionHash: definitionHash(extensionName),
    metadata: {}
  }));
}

export function buildCanonicalMigrationManifest(migrationId: string, filePath: string): CanonicalMigrationManifest {
  const sql = readFileSync(filePath, "utf8");
  const numericId = migrationId.slice(0, 4);
  const metadata = manualMetadata[numericId];

  if (!metadata) {
    throw new Error(`No reviewed metadata exists for migration ${migrationId}.`);
  }

  const objects = [
    ...extractExtensions(sql),
    ...extractTables(sql),
    ...extractIndexes(sql),
    ...extractTriggers(sql),
    ...extractFunctions(sql),
    ...extractComments(sql)
  ].sort((left, right) => {
    const leftKey = `${left.objectType}:${left.schemaName}:${left.parentObject ?? ""}:${left.objectName}`;
    const rightKey = `${right.objectType}:${right.schemaName}:${right.parentObject ?? ""}:${right.objectName}`;
    return leftKey.localeCompare(rightKey);
  });

  return {
    migrationId,
    sourceSha256: sha256(sql),
    objects,
    ...metadata
  };
}
