import { Client } from "pg";

import { definitionHash } from "./hash.ts";
import { collapseWhitespace, normalizeSchemaExpression, normalizeSchemaIdentifier } from "./schema-normalization.ts";
import { buildSchemaDefinitionHash } from "./schema-definition-hash.ts";
import type {
  MigrationLedgerRow,
  MigrationLedgerTable,
  SchemaDefinitionObjectType,
  SchemaInventoryObject,
  SchemaInventoryReport
} from "./types.ts";

const schemaInventoryQueries = {
  extensions: `
    SELECT extname AS object_name
    FROM pg_extension
    ORDER BY extname;
  `,
  tables: `
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
  `,
  comments: `
    SELECT
      n.nspname AS table_schema,
      c.relname AS table_name,
      obj_description(c.oid, 'pg_class') AS comment_text
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND obj_description(c.oid, 'pg_class') IS NOT NULL
    ORDER BY n.nspname, c.relname;
  `,
  columns: `
    SELECT
      table_schema,
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      is_generated,
      generation_expression,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name, ordinal_position;
  `,
  constraints: `
    SELECT
      n.nspname AS table_schema,
      c.relname AS table_name,
      con.contype AS constraint_type,
      pg_get_constraintdef(con.oid, true) AS constraint_definition
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY n.nspname, c.relname, con.oid;
  `,
  indexes: `
    SELECT schemaname AS table_schema, tablename AS table_name, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename, indexname;
  `,
  triggers: `
    SELECT
      n.nspname AS table_schema,
      c.relname AS table_name,
      t.tgname AS trigger_name,
      pg_get_triggerdef(t.oid, true) AS trigger_definition,
      t.tgenabled AS trigger_enabled
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND NOT t.tgisinternal
    ORDER BY n.nspname, c.relname, t.tgname;
  `,
  functions: `
    SELECT
      n.nspname AS function_schema,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS function_arguments,
      pg_get_functiondef(p.oid) AS function_definition,
      pg_get_function_result(p.oid) AS return_type,
      l.lanname AS language,
      p.prosecdef AS security_definer,
      p.provolatile AS volatility,
      p.proisstrict AS strict,
      p.proleakproof AS leakproof
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid);
  `,
  sequences: `
    SELECT sequence_schema, sequence_name, data_type, start_value, minimum_value, maximum_value, increment
    FROM information_schema.sequences
    WHERE sequence_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY sequence_schema, sequence_name;
  `,
  rowLevelSecurity: `
    SELECT n.nspname AS table_schema, c.relname AS table_name, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY n.nspname, c.relname;
  `,
  policies: `
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename, policyname;
  `
} as const;

export function createSchemaInventorySql() {
  return schemaInventoryQueries;
}

function createObject(
  objectType: SchemaDefinitionObjectType,
  schemaName: string,
  objectName: string,
  metadata: Record<string, unknown>,
  parentObject?: string
): SchemaInventoryObject {
  const object: SchemaInventoryObject = {
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

function toSafeScalar(value: unknown): string | number | boolean | null {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return JSON.stringify(value) ?? String(value);
}

function extractSafeRecord(row: Record<string, unknown>): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, toSafeScalar(value)])
  );
}

function stripWrappingQuotes(value: string): string {
  return value.trim().replace(/^"(.*)"$/, "$1");
}

function normalizeName(value: string): string {
  return normalizeSchemaIdentifier(stripWrappingQuotes(value.replace(/^ONLY\s+/i, "").replace(/^public\./i, "")));
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

function toStringArray(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return trimmed.length > 0 ? [trimmed] : [];
  }

  return trimmed
    .slice(1, -1)
    .split(",")
    .map((entry) => entry.replace(/^"|"$/g, "").trim())
    .filter((entry) => entry.length > 0);
}

function extractIndexComponents(
  indexDefinition: string
): { columns: string[]; method: string; predicate: string | null; unique: boolean } | null {
  const headerMatch = indexDefinition.match(
    /CREATE\s+(UNIQUE\s+)?INDEX\s+[^\s]+\s+ON\s+[^\s]+\s+USING\s+([a-z0-9_]+)\s*\(/i
  );
  if (!headerMatch || headerMatch.index === undefined) {
    return null;
  }

  const openParenIndex = headerMatch.index + headerMatch[0].length - 1;
  let depth = 0;
  let closeParenIndex = -1;

  for (let index = openParenIndex; index < indexDefinition.length; index += 1) {
    const character = indexDefinition[index] ?? "";
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        closeParenIndex = index;
        break;
      }
    }
  }

  if (closeParenIndex === -1) {
    return null;
  }

  const columnsFragment = indexDefinition.slice(openParenIndex + 1, closeParenIndex);
  const remainder = indexDefinition.slice(closeParenIndex + 1);
  const predicateMatch = remainder.match(/\bWHERE\s+([\s\S]+)$/i);

  return {
    columns: parseColumnList(columnsFragment),
    method: (headerMatch[2] ?? "btree").toLowerCase(),
    predicate: predicateMatch?.[1]?.trim() ?? null,
    unique: Boolean(headerMatch[1])
  };
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

function parseConstraintObject(
  tableSchema: string,
  tableName: string,
  constraintType: string,
  constraintDefinition: string
): SchemaInventoryObject | null {
  const normalizedType = constraintType.trim().toLowerCase();
  const definition = constraintDefinition.trim();

  if (normalizedType === "p" || definition.startsWith("PRIMARY KEY")) {
    const columns = parseColumnList(definition.match(/PRIMARY KEY\s*\((.+)\)/i)?.[1] ?? "");
    const metadata = { columns };
    return createObject("primary_key", tableSchema, buildConstraintObjectName(tableName, "primary_key", metadata), metadata, tableName);
  }

  if (normalizedType === "u" || definition.startsWith("UNIQUE")) {
    const columns = parseColumnList(definition.match(/UNIQUE\s*\((.+)\)/i)?.[1] ?? "");
    const metadata = { columns };
    return createObject("unique_constraint", tableSchema, buildConstraintObjectName(tableName, "unique_constraint", metadata), metadata, tableName);
  }

  if (normalizedType === "f" || definition.startsWith("FOREIGN KEY")) {
    const match = definition.match(/FOREIGN KEY\s*\((.+)\)\s+REFERENCES\s+([^\s(]+)\s*\((.+)\)/i);
    if (!match) {
      return null;
    }

    const metadata = {
      columns: parseColumnList(match[1] ?? ""),
      referencedTable: normalizeName(match[2] ?? ""),
      referencedColumns: parseColumnList(match[3] ?? ""),
      onDelete: definition.match(/ON DELETE\s+([A-Z ]+)/i)?.[1]?.trim() ?? null,
      onUpdate: definition.match(/ON UPDATE\s+([A-Z ]+)/i)?.[1]?.trim() ?? null
    };

    return createObject("foreign_key", tableSchema, buildConstraintObjectName(tableName, "foreign_key", metadata), metadata, tableName);
  }

  if (normalizedType === "c" || definition.startsWith("CHECK")) {
    const metadata = {
      expression: definition.replace(/^CHECK\s*/i, "")
    };

    return createObject("check_constraint", tableSchema, buildConstraintObjectName(tableName, "check_constraint", metadata), metadata, tableName);
  }

  return null;
}

function parseIndexObject(
  tableSchema: string,
  tableName: string,
  indexName: string,
  indexDefinition: string
): SchemaInventoryObject {
  const parsed = extractIndexComponents(indexDefinition);

  const metadata = parsed
    ? {
        columns: parsed.columns,
        method: parsed.method,
        predicate: parsed.predicate,
        unique: parsed.unique
      }
    : {
        definition: indexDefinition
      };

  return createObject("index", tableSchema, normalizeName(indexName), metadata, tableName);
}

function extractFunctionBody(definition: string): string {
  const dollarQuoted = definition.match(/AS\s+\$[^$]*\$([\s\S]*?)\$[^$]*\$/i);
  if (dollarQuoted?.[1]) {
    return dollarQuoted[1].trim();
  }

  const singleQuoted = definition.match(/AS\s+'([\s\S]*?)'/i);
  if (singleQuoted?.[1]) {
    return singleQuoted[1].trim();
  }

  return definition.trim();
}

function escapeIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function parseTriggerDefinition(definition: string): {
  actionTiming: string | null;
  eventManipulation: string[];
  functionName: string | null;
  level: string | null;
} {
  const match = definition.match(
    /CREATE TRIGGER\s+\S+\s+(BEFORE|AFTER|INSTEAD OF)\s+([\s\S]*?)\s+ON\s+\S+\s+FOR EACH\s+(ROW|STATEMENT)\s+EXECUTE FUNCTION\s+([a-zA-Z0-9_".]+)/i
  );

  return {
    actionTiming: match?.[1] ?? null,
    eventManipulation: (match?.[2] ?? "").split(/\s+OR\s+/i).map((value) => value.trim()).filter(Boolean),
    functionName: match?.[4] ? normalizeName(match[4]) : null,
    level: match?.[3] ?? null
  };
}

export async function collectSchemaInventory(connectionString: string): Promise<SchemaInventoryReport> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const objects: SchemaInventoryObject[] = [];
    const tableColumnsByKey = new Map<string, string[]>();

    const extensions = await client.query<{ object_name: string }>(schemaInventoryQueries.extensions);
    for (const row of extensions.rows) {
      objects.push(createObject("extension", "public", normalizeName(row.object_name), { name: row.object_name }));
    }

    const columns = await client.query<{
      table_schema: string;
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
      is_generated: string;
      generation_expression: string | null;
      ordinal_position: number;
    }>(schemaInventoryQueries.columns);

    for (const row of columns.rows) {
      const tableKey = `${row.table_schema}:${row.table_name}`;
      const tableColumns = tableColumnsByKey.get(tableKey) ?? [];
      tableColumns.push(normalizeName(row.column_name));
      tableColumnsByKey.set(tableKey, tableColumns);

      objects.push(
        createObject(
          "column",
          row.table_schema,
          normalizeName(row.column_name),
          {
            dataType: row.data_type,
            isNullable: row.is_nullable,
            defaultHash: definitionHash(normalizeSchemaExpression(row.column_default) ?? ""),
            hasDefault: row.column_default !== null,
            isGenerated: row.is_generated,
            generationExpression: row.generation_expression
          },
          row.table_name
        )
      );
    }

    const tables = await client.query<{ table_schema: string; table_name: string }>(schemaInventoryQueries.tables);
    for (const row of tables.rows) {
      const tableKey = `${row.table_schema}:${row.table_name}`;
      objects.push(
        createObject("table", row.table_schema, normalizeName(row.table_name), {
          columns: tableColumnsByKey.get(tableKey) ?? []
        })
      );
    }

    const comments = await client.query<{
      table_schema: string;
      table_name: string;
      comment_text: string;
    }>(schemaInventoryQueries.comments);
    for (const row of comments.rows) {
      objects.push(
        createObject("comment", row.table_schema, normalizeName(row.table_name), {
          targetType: "table",
          commentHash: definitionHash(collapseWhitespace(row.comment_text)),
          commentPresent: true
        })
      );
    }

    const constraints = await client.query<{
      table_schema: string;
      table_name: string;
      constraint_type: string;
      constraint_definition: string;
    }>(schemaInventoryQueries.constraints);
    for (const row of constraints.rows) {
      const constraintObject = parseConstraintObject(
        row.table_schema,
        row.table_name,
        row.constraint_type,
        row.constraint_definition
      );
      if (constraintObject) {
        objects.push(constraintObject);
      }
    }

    const indexes = await client.query<{
      table_schema: string;
      table_name: string;
      indexname: string;
      indexdef: string;
    }>(schemaInventoryQueries.indexes);
    for (const row of indexes.rows) {
      if (normalizeName(row.indexname).endsWith("_pkey") || normalizeName(row.indexname).endsWith("_key")) {
        continue;
      }
      objects.push(parseIndexObject(row.table_schema, row.table_name, row.indexname, row.indexdef));
    }

    const triggers = await client.query<{
      table_schema: string;
      table_name: string;
      trigger_name: string;
      trigger_definition: string;
      trigger_enabled: string;
    }>(schemaInventoryQueries.triggers);
    for (const row of triggers.rows) {
      const parsed = parseTriggerDefinition(row.trigger_definition);
      objects.push(
        createObject(
          "trigger",
          row.table_schema,
          normalizeName(row.trigger_name),
          {
            actionTiming: parsed.actionTiming,
            enabled: row.trigger_enabled === "O",
            eventManipulation: parsed.eventManipulation,
            functionName: parsed.functionName,
            level: parsed.level
          },
          row.table_name
        )
      );
    }

    const functions = await client.query<{
      function_schema: string;
      function_name: string;
      function_arguments: string;
      function_definition: string;
      return_type: string;
      language: string;
      security_definer: boolean;
      volatility: string;
      strict: boolean;
      leakproof: boolean;
    }>(schemaInventoryQueries.functions);
    for (const row of functions.rows) {
      objects.push(
        createObject("function", row.function_schema, normalizeName(row.function_name), {
          arguments: row.function_arguments,
          bodyHash: definitionHash(collapseWhitespace(extractFunctionBody(row.function_definition))),
          language: row.language,
          leakproof: row.leakproof,
          returnType: row.return_type,
          securityDefiner: row.security_definer,
          strict: row.strict,
          volatility:
            row.volatility === "i"
              ? "immutable"
              : row.volatility === "s"
                ? "stable"
                : "volatile"
        })
      );
    }

    const sequences = await client.query<{
      sequence_schema: string;
      sequence_name: string;
      data_type: string;
      start_value: string;
      minimum_value: string;
      maximum_value: string;
      increment: string;
    }>(schemaInventoryQueries.sequences);
    for (const row of sequences.rows) {
      objects.push(
        createObject("sequence", row.sequence_schema, normalizeName(row.sequence_name), {
          dataType: row.data_type,
          startValue: row.start_value,
          minimumValue: row.minimum_value,
          maximumValue: row.maximum_value,
          increment: row.increment
        })
      );
    }

    const rls = await client.query<{
      table_schema: string;
      table_name: string;
      relrowsecurity: boolean;
      relforcerowsecurity: boolean;
    }>(schemaInventoryQueries.rowLevelSecurity);
    for (const row of rls.rows) {
      if (!row.relrowsecurity && !row.relforcerowsecurity) {
        continue;
      }

      objects.push(
        createObject("row_level_security", row.table_schema, normalizeName(row.table_name), {
          rowSecurity: row.relrowsecurity,
          forceRowSecurity: row.relforcerowsecurity
        })
      );
    }

    const policies = await client.query<{
      schemaname: string;
      tablename: string;
      policyname: string;
      permissive: string;
      roles: string[];
      cmd: string;
      qual: string | null;
      with_check: string | null;
    }>(schemaInventoryQueries.policies);
    for (const row of policies.rows) {
      objects.push(
        createObject(
          "policy",
          row.schemaname,
          normalizeName(row.policyname),
          {
            permissive: row.permissive,
            rolesHash: definitionHash(JSON.stringify(toStringArray(row.roles).sort())),
            command: row.cmd,
            qualifierHash: definitionHash(normalizeSchemaExpression(row.qual) ?? ""),
            qualifierPresent: row.qual !== null,
            withCheckHash: definitionHash(normalizeSchemaExpression(row.with_check) ?? ""),
            withCheckPresent: row.with_check !== null
          },
          row.tablename
        )
      );
    }

    const ledgerTablesQuery = await client.query<{
      table_schema: string;
      table_name: string;
    }>(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_name ILIKE '%migration%'
      ORDER BY table_schema, table_name;
    `);

    const migrationLedgerTables: MigrationLedgerTable[] = [];
    const migrationLedgerRows: MigrationLedgerRow[] = [];

    for (const ledgerTable of ledgerTablesQuery.rows) {
      const columnsQuery = await client.query<{ column_name: string }>(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = $1
            AND table_name = $2
          ORDER BY ordinal_position;
        `,
        [ledgerTable.table_schema, ledgerTable.table_name]
      );

      const safeColumns = columnsQuery.rows
        .map((row) => row.column_name)
        .filter((columnName) =>
          ["id", "name", "version", "migration_id", "filename", "applied_at", "created_at"].includes(columnName)
        );

      migrationLedgerTables.push({
        schemaName: ledgerTable.table_schema,
        tableName: ledgerTable.table_name,
        safeColumns
      });

      if (safeColumns.length === 0) {
        continue;
      }

      const safeIdentifiers = safeColumns.map((columnName) => escapeIdentifier(columnName)).join(", ");
      const rowsQuery = await client.query<Record<string, unknown>>(
        `SELECT ${safeIdentifiers} FROM ${escapeIdentifier(ledgerTable.table_schema)}.${escapeIdentifier(ledgerTable.table_name)} ORDER BY 1`
      );

      for (const row of rowsQuery.rows) {
        migrationLedgerRows.push({
          schemaName: ledgerTable.table_schema,
          tableName: ledgerTable.table_name,
          record: extractSafeRecord(row)
        });
      }
    }

    return {
      generatedAtUtc: new Date().toISOString(),
      objects: objects.sort((left, right) =>
        `${left.objectType}:${left.schemaName}:${left.parentObject ?? ""}:${left.objectName}`.localeCompare(
          `${right.objectType}:${right.schemaName}:${right.parentObject ?? ""}:${right.objectName}`
        )
      ),
      migrationLedgerTables,
      migrationLedgerRows
    };
  } finally {
    await client.end();
  }
}
