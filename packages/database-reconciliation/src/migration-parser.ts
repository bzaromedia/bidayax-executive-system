import { readFileSync } from "node:fs";

import { definitionHash, sha256 } from "./hash.ts";
import { collapseWhitespace, normalizeSchemaExpression, normalizeSchemaIdentifier } from "./schema-normalization.ts";
import { buildSchemaDefinitionHash } from "./schema-definition-hash.ts";
import type { CanonicalManifestObject, CanonicalMigrationManifest, SchemaDefinitionObjectType } from "./types.ts";

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

function stripWrappingQuotes(value: string): string {
  return value.trim().replace(/^"(.*)"$/, "$1");
}

function normalizeName(value: string): string {
  return normalizeSchemaIdentifier(stripWrappingQuotes(value.trim().replace(/^public\./i, "")));
}

function splitTopLevelCsv(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index] ?? "";

    if (character === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += character;
      continue;
    }

    if (character === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += character;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth = Math.max(0, depth - 1);
      } else if (character === "," && depth === 0) {
        if (current.trim().length > 0) {
          parts.push(current.trim());
        }
        current = "";
        continue;
      }
    }

    current += character;
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts;
}

function normalizeListEntry(value: string): string {
  const trimmed = stripWrappingQuotes(value.trim());
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed) ? normalizeName(trimmed) : trimmed.replace(/\s+/g, " ").trim();
}

function parseColumnList(fragment: string): string[] {
  return splitTopLevelCsv(fragment).map((entry) => normalizeListEntry(entry));
}

function createObject(
  objectType: SchemaDefinitionObjectType,
  schemaName: string,
  objectName: string,
  metadata: Record<string, unknown>,
  parentObject?: string
): CanonicalManifestObject {
  const object: CanonicalManifestObject = {
    objectType,
    schemaName,
    objectName,
    ...(parentObject ? { parentObject } : {}),
    definitionHash: "",
    metadata
  };

  object.definitionHash = buildSchemaDefinitionHash(object);
  return object;
}

function buildConstraintObjectName(
  tableName: string,
  objectType: Extract<SchemaDefinitionObjectType, "primary_key" | "foreign_key" | "unique_constraint" | "check_constraint">,
  metadata: Record<string, unknown>
): string {
  if (objectType === "primary_key") {
    return `${normalizeName(tableName)}#primary_key`;
  }

  if (objectType === "unique_constraint") {
    return `${normalizeName(tableName)}#unique#${(metadata.columns as string[]).join(",")}`;
  }

  if (objectType === "foreign_key") {
    return `${normalizeName(tableName)}#foreign_key#${(metadata.columns as string[]).join(",")}#${String(metadata.referencedTable)}#${(metadata.referencedColumns as string[]).join(",")}`;
  }

  return `${normalizeName(tableName)}#check#${definitionHash(normalizeSchemaExpression(metadata.expression) ?? "").slice(0, 12)}`;
}

function extractDataType(fragment: string): string {
  const tokens = fragment.trim().split(/\s+/);
  const collected: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]?.toUpperCase() ?? "";
    if (["DEFAULT", "NOT", "NULL", "CHECK", "CONSTRAINT", "REFERENCES", "UNIQUE", "PRIMARY", "GENERATED"].includes(token)) {
      break;
    }
    collected.push(tokens[index] ?? "");
  }

  return collected.join(" ");
}

function parseInlineConstraintObjects(tableName: string, columnName: string, fragment: string): CanonicalManifestObject[] {
  const constraints: CanonicalManifestObject[] = [];

  if (/PRIMARY\s+KEY/i.test(fragment)) {
    const metadata = { columns: [normalizeName(columnName)] };
    constraints.push(
      createObject("primary_key", "public", buildConstraintObjectName(tableName, "primary_key", metadata), metadata, tableName)
    );
  }

  if (/\bUNIQUE\b/i.test(fragment)) {
    const metadata = { columns: [normalizeName(columnName)] };
    constraints.push(
      createObject("unique_constraint", "public", buildConstraintObjectName(tableName, "unique_constraint", metadata), metadata, tableName)
    );
  }

  const foreignKeyMatch = fragment.match(/REFERENCES\s+([^\s(]+)\s*\((.+)\)/i);
  if (foreignKeyMatch) {
    const metadata = {
      columns: [normalizeName(columnName)],
      referencedTable: normalizeName(foreignKeyMatch[1] ?? ""),
      referencedColumns: parseColumnList(foreignKeyMatch[2] ?? ""),
      onDelete: fragment.match(/ON DELETE\s+([A-Z ]+)/i)?.[1]?.trim() ?? null,
      onUpdate: fragment.match(/ON UPDATE\s+([A-Z ]+)/i)?.[1]?.trim() ?? null
    };
    constraints.push(
      createObject("foreign_key", "public", buildConstraintObjectName(tableName, "foreign_key", metadata), metadata, tableName)
    );
  }

  const checkMatch = fragment.match(/CHECK\s*\(([\s\S]+)\)/i);
  if (checkMatch?.[1]) {
    const metadata = { expression: checkMatch[1] };
    constraints.push(
      createObject("check_constraint", "public", buildConstraintObjectName(tableName, "check_constraint", metadata), metadata, tableName)
    );
  }

  return constraints;
}

function parseTableConstraintObject(tableName: string, entry: string): CanonicalManifestObject | null {
  const normalizedEntry = entry.trim();

  if (/^PRIMARY\s+KEY/i.test(normalizedEntry)) {
    const metadata = { columns: parseColumnList(normalizedEntry.match(/PRIMARY KEY\s*\((.+)\)/i)?.[1] ?? "") };
    return createObject("primary_key", "public", buildConstraintObjectName(tableName, "primary_key", metadata), metadata, tableName);
  }

  if (/^UNIQUE\b/i.test(normalizedEntry)) {
    const metadata = { columns: parseColumnList(normalizedEntry.match(/UNIQUE\s*\((.+)\)/i)?.[1] ?? "") };
    return createObject("unique_constraint", "public", buildConstraintObjectName(tableName, "unique_constraint", metadata), metadata, tableName);
  }

  if (/^FOREIGN\s+KEY/i.test(normalizedEntry)) {
    const match = normalizedEntry.match(/FOREIGN KEY\s*\((.+)\)\s+REFERENCES\s+([^\s(]+)\s*\((.+)\)/i);
    if (!match) {
      return null;
    }

    const metadata = {
      columns: parseColumnList(match[1] ?? ""),
      referencedTable: normalizeName(match[2] ?? ""),
      referencedColumns: parseColumnList(match[3] ?? ""),
      onDelete: normalizedEntry.match(/ON DELETE\s+([A-Z ]+)/i)?.[1]?.trim() ?? null,
      onUpdate: normalizedEntry.match(/ON UPDATE\s+([A-Z ]+)/i)?.[1]?.trim() ?? null
    };

    return createObject("foreign_key", "public", buildConstraintObjectName(tableName, "foreign_key", metadata), metadata, tableName);
  }

  if (/^CHECK\s*\(/i.test(normalizedEntry)) {
    const metadata = { expression: normalizedEntry.match(/^CHECK\s*\(([\s\S]+)\)$/i)?.[1] ?? normalizedEntry.replace(/^CHECK\s*/i, "") };
    return createObject("check_constraint", "public", buildConstraintObjectName(tableName, "check_constraint", metadata), metadata, tableName);
  }

  return null;
}

function extractTables(sql: string): CanonicalManifestObject[] {
  const matches = Array.from(
    sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/g)
  );

  return matches.flatMap((match) => {
    const tableName = match[1];
    const body = match[2];
    if (!tableName || !body) {
      return [];
    }

    const entries = splitTopLevelCsv(body);
    const columnObjects: CanonicalManifestObject[] = [];
    const constraintObjects: CanonicalManifestObject[] = [];

    for (const entry of entries) {
      if (/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b/i.test(entry)) {
        const constraintObject = parseTableConstraintObject(tableName, entry.replace(/^CONSTRAINT\s+[A-Za-z0-9_]+\s+/i, ""));
        if (constraintObject) {
          constraintObjects.push(constraintObject);
        }
        continue;
      }

      const columnName = entry.match(/^([a-zA-Z0-9_]+)/)?.[1];
      if (!columnName) {
        continue;
      }

      const definition = entry.slice(columnName.length).trim();
      columnObjects.push(
        createObject(
          "column",
          "public",
          normalizeName(columnName),
          {
            dataType: extractDataType(definition),
            isNullable: !/NOT\s+NULL|PRIMARY\s+KEY/i.test(definition),
            defaultHash:
              definitionHash(
                normalizeSchemaExpression(
                  definition.match(/\bDEFAULT\s+(.+?)(?=\s+(?:NOT\s+NULL|NULL|CHECK|CONSTRAINT|REFERENCES|UNIQUE|PRIMARY\s+KEY|GENERATED)\b|$)/i)?.[1] ?? null
                ) ?? ""
              ),
            hasDefault:
              definition.match(/\bDEFAULT\s+(.+?)(?=\s+(?:NOT\s+NULL|NULL|CHECK|CONSTRAINT|REFERENCES|UNIQUE|PRIMARY\s+KEY|GENERATED)\b|$)/i) !==
              null,
            isGenerated: /GENERATED\s+ALWAYS\s+AS/i.test(definition),
            generationExpression:
              definition.match(/GENERATED\s+ALWAYS\s+AS\s*\((.+)\)\s+STORED/i)?.[1] ?? null
          },
          tableName
        )
      );
      constraintObjects.push(...parseInlineConstraintObjects(tableName, columnName, definition));
    }

    const tableObject = createObject("table", "public", normalizeName(tableName), {
      columns: columnObjects.map((object) => object.objectName)
    });

    return [tableObject, ...columnObjects, ...constraintObjects];
  });
}

function extractIndexes(sql: string): CanonicalManifestObject[] {
  return Array.from(sql.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX IF NOT EXISTS[\s\S]*?;/gi)).flatMap((match) => {
    const statement = match[0];
    if (!statement) {
      return [];
    }

    const parsed = statement.match(
      /CREATE\s+(UNIQUE\s+)?INDEX IF NOT EXISTS\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_".]+)\s*(?:USING\s+([a-zA-Z0-9_]+)\s*)?\((.+)\)(?:\s+WHERE\s+([\s\S]*?))?;/i
    );
    if (!parsed) {
      return [];
    }

    const indexName = parsed[2];
    const tableName = parsed[3];
    if (!indexName || !tableName) {
      return [];
    }

    return [
      createObject(
        "index",
        "public",
        normalizeName(indexName),
        {
          columns: parseColumnList(parsed[5] ?? ""),
          method: (parsed[4] ?? "btree").toLowerCase(),
          predicate: parsed[6]?.trim() ?? null,
          unique: Boolean(parsed[1])
        },
        normalizeName(tableName)
      )
    ];
  });
}

function extractTriggers(sql: string): CanonicalManifestObject[] {
  return Array.from(
    sql.matchAll(/CREATE TRIGGER\s+([a-zA-Z0-9_]+)\s+(BEFORE|AFTER|INSTEAD OF)\s+([\s\S]*?)\s+ON\s+([a-zA-Z0-9_]+)\s+FOR EACH\s+(ROW|STATEMENT)\s+EXECUTE FUNCTION\s+([a-zA-Z0-9_]+)\s*\(/gi)
  ).flatMap((match) => {
    const triggerName = match[1];
    const actionTiming = match[2];
    const eventManipulation = match[3];
    const tableName = match[4];
    const level = match[5];
    const functionName = match[6];
    if (!triggerName || !tableName || !functionName) {
      return [];
    }

    return [
      createObject(
        "trigger",
        "public",
        normalizeName(triggerName),
        {
          actionTiming,
          enabled: true,
          eventManipulation: (eventManipulation ?? "").split(/\s+OR\s+/i).map((value) => value.trim()).filter(Boolean),
          functionName,
          level
        },
        tableName
      )
    ];
  });
}

function extractFunctions(sql: string): CanonicalManifestObject[] {
  return Array.from(
    sql.matchAll(/CREATE OR REPLACE FUNCTION\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*RETURNS\s+([a-zA-Z0-9_ ]+?)\s+AS\s+\$\$([\s\S]*?)\$\$([\s\S]*?);/gi)
  ).flatMap((match) => {
    const functionName = match[1];
    const functionArguments = match[2] ?? "";
    const returnType = match[3];
    const body = match[4];
    const tail = match[5] ?? "";
    const language = tail.match(/\bLANGUAGE\s+([a-zA-Z0-9_]+)/i)?.[1];
    if (!functionName || !returnType || !language) {
      return [];
    }

    return [
      createObject("function", "public", normalizeName(functionName), {
        arguments: functionArguments,
        bodyHash: definitionHash(collapseWhitespace(body ?? "")),
        language,
        leakproof: /\bLEAKPROOF\b/i.test(tail),
        returnType,
        securityDefiner: /\bSECURITY\s+DEFINER\b/i.test(tail),
        strict: /\bSTRICT\b|\bRETURNS\s+NULL\s+ON\s+NULL\s+INPUT\b/i.test(tail),
        volatility: tail.match(/\b(IMMUTABLE|STABLE|VOLATILE)\b/i)?.[1]?.toLowerCase() ?? "volatile"
      })
    ];
  });
}

function extractComments(sql: string): CanonicalManifestObject[] {
  return Array.from(sql.matchAll(/COMMENT ON TABLE\s+([a-zA-Z0-9_"]+)\s+IS\s+'([\s\S]*?)';/gi)).flatMap((match) => {
    const tableName = match[1];
    const commentText = match[2];
    if (!tableName) {
      return [];
    }

    return [
      createObject("comment", "public", normalizeName(tableName), {
        commentHash: definitionHash(collapseWhitespace(commentText ?? "")),
        targetType: "table",
        commentPresent: true
      })
    ];
  });
}

function extractExtensions(sql: string): CanonicalManifestObject[] {
  return Array.from(sql.matchAll(/CREATE EXTENSION IF NOT EXISTS\s+([a-zA-Z0-9_]+)/gi)).flatMap((match) => {
    const extensionName = match[1];
    if (!extensionName) {
      return [];
    }

    return [createObject("extension", "public", normalizeName(extensionName), { name: extensionName })];
  });
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
