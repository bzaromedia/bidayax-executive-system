import { Client } from "pg";

import { definitionHash } from "./hash.js";
import type {
  MigrationLedgerRow,
  MigrationLedgerTable,
  SchemaInventoryObject,
  SchemaInventoryReport
} from "./types.js";

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
      generation_expression
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name, ordinal_position;
  `,
  constraints: `
    SELECT
      n.nspname AS table_schema,
      c.relname AS table_name,
      con.conname AS constraint_name,
      CASE con.contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
        ELSE con.contype::text
      END AS constraint_type,
      pg_get_constraintdef(con.oid) AS constraint_definition
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY n.nspname, c.relname, con.conname;
  `,
  indexes: `
    SELECT schemaname AS table_schema, tablename AS table_name, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename, indexname;
  `,
  triggers: `
    SELECT
      trigger_schema AS table_schema,
      event_object_table AS table_name,
      trigger_name,
      action_timing,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY trigger_schema, event_object_table, trigger_name;
  `,
  functions: `
    SELECT
      n.nspname AS function_schema,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS function_arguments,
      pg_get_functiondef(p.oid) AS function_definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
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
    ORDER BY schemaname, tablename, policyname;
  `
} as const;

export function createSchemaInventorySql() {
  return schemaInventoryQueries;
}

function inventoryObject(
  objectType: string,
  schemaName: string,
  objectName: string,
  metadata: Record<string, unknown>,
  parentObject?: string
): SchemaInventoryObject {
  return {
    objectType,
    schemaName,
    objectName,
    ...(parentObject ? { parentObject } : {}),
    definitionHash: definitionHash({ objectType, schemaName, objectName, parentObject, metadata }),
    metadata
  };
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

export async function collectSchemaInventory(connectionString: string): Promise<SchemaInventoryReport> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const objects: SchemaInventoryObject[] = [];

    const extensions = await client.query<{ object_name: string }>(schemaInventoryQueries.extensions);
    for (const row of extensions.rows) {
      objects.push(inventoryObject("extension", "public", row.object_name, {}));
    }

    const tables = await client.query<{ table_schema: string; table_name: string }>(schemaInventoryQueries.tables);
    for (const row of tables.rows) {
      objects.push(inventoryObject("table", row.table_schema, row.table_name, {}));
    }

    const comments = await client.query<{
      table_schema: string;
      table_name: string;
      comment_text: string;
    }>(schemaInventoryQueries.comments);
    for (const row of comments.rows) {
      objects.push(
        inventoryObject("comment", row.table_schema, row.table_name, {
          targetType: "table",
          commentText: row.comment_text
        })
      );
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
    }>(schemaInventoryQueries.columns);
    for (const row of columns.rows) {
      objects.push(
        inventoryObject(
          "column",
          row.table_schema,
          row.column_name,
          {
            dataType: row.data_type,
            isNullable: row.is_nullable,
            default: row.column_default,
            isGenerated: row.is_generated,
            generationExpression: row.generation_expression
          },
          row.table_name
        )
      );
    }

    const constraints = await client.query<{
      table_schema: string;
      table_name: string;
      constraint_name: string;
      constraint_type: string;
      constraint_definition: string;
    }>(schemaInventoryQueries.constraints);
    for (const row of constraints.rows) {
      objects.push(
        inventoryObject(
          "constraint",
          row.table_schema,
          row.constraint_name,
          {
            type: row.constraint_type,
            definition: row.constraint_definition
          },
          row.table_name
        )
      );
    }

    const indexes = await client.query<{
      table_schema: string;
      table_name: string;
      indexname: string;
      indexdef: string;
    }>(schemaInventoryQueries.indexes);
    for (const row of indexes.rows) {
      objects.push(
        inventoryObject("index", row.table_schema, row.indexname, { definition: row.indexdef }, row.table_name)
      );
    }

    const triggers = await client.query<{
      table_schema: string;
      table_name: string;
      trigger_name: string;
      action_timing: string;
      event_manipulation: string;
      action_statement: string;
    }>(schemaInventoryQueries.triggers);
    for (const row of triggers.rows) {
      objects.push(
        inventoryObject(
          "trigger",
          row.table_schema,
          row.trigger_name,
          {
            actionTiming: row.action_timing,
            eventManipulation: row.event_manipulation,
            actionStatement: row.action_statement
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
    }>(schemaInventoryQueries.functions);
    for (const row of functions.rows) {
      objects.push(
        inventoryObject("function", row.function_schema, row.function_name, {
          arguments: row.function_arguments,
          definition: row.function_definition
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
        inventoryObject("sequence", row.sequence_schema, row.sequence_name, {
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
      objects.push(
        inventoryObject("row_level_security", row.table_schema, row.table_name, {
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
        inventoryObject(
          "policy",
          row.schemaname,
          row.policyname,
          {
            permissive: row.permissive,
            roles: row.roles,
            command: row.cmd,
            qualifier: row.qual,
            withCheck: row.with_check
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

      const safeIdentifiers = safeColumns.map((columnName) => `"${columnName}"`).join(", ");
      const rowsQuery = await client.query<Record<string, unknown>>(
        `SELECT ${safeIdentifiers} FROM "${ledgerTable.table_schema}"."${ledgerTable.table_name}" ORDER BY 1`
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
