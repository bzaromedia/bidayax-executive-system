import type { CanonicalManifestObject, SchemaInventoryObject, SchemaDefinitionObjectType } from "./types.ts";

type SchemaLikeObject = CanonicalManifestObject | SchemaInventoryObject;

export function collapseWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
}

function stripWrappingQuotes(value: string): string {
  return value.replace(/^"(.*)"$/, "$1");
}

export function normalizeSchemaIdentifier(value: string): string {
  return stripWrappingQuotes(value.trim().replace(/^public\./i, "")).toLowerCase();
}

function normalizeNullable(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = collapseWhitespace(value).toLowerCase();
  if (normalized === "yes" || normalized === "true") {
    return true;
  }
  if (normalized === "no" || normalized === "false") {
    return false;
  }

  return null;
}

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = collapseWhitespace(value).toLowerCase();
  if (["true", "t", "yes", "always"].includes(normalized)) {
    return true;
  }
  if (["false", "f", "no", "never"].includes(normalized)) {
    return false;
  }

  return null;
}

function normalizeType(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = collapseWhitespace(value).toLowerCase();
  switch (normalized) {
    case "timestamp with time zone":
    case "timestamptz":
      return "timestamptz";
    case "timestamp without time zone":
    case "timestamp":
      return "timestamp";
    case "character varying":
    case "varchar":
      return "varchar";
    case "boolean":
    case "bool":
      return "boolean";
    case "integer":
    case "int4":
      return "integer";
    case "bigint":
    case "int8":
      return "bigint";
    default:
      return normalized;
  }
}

function unwrapOuterParens(value: string): string {
  let result = value.trim();

  while (hasSingleOuterParenPair(result)) {
    result = result.slice(1, -1).trim();
  }

  return result;
}

function hasSingleOuterParenPair(value: string): boolean {
  if (!value.startsWith("(") || !value.endsWith(")")) {
    return false;
  }

  let depth = 0;
  let inSingleQuote = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index] ?? "";

    if (character === "'" && value[index - 1] !== "\\") {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (inSingleQuote) {
      continue;
    }

    if (character === "(") {
      depth += 1;
    }

    if (character === ")") {
      depth -= 1;
      if (depth === 0 && index < value.length - 1) {
        return false;
      }
    }
  }

  return depth === 0;
}

function splitExpressionList(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inSingleQuote = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index] ?? "";

    if (character === "'" && value[index - 1] !== "\\") {
      inSingleQuote = !inSingleQuote;
      current += character;
      continue;
    }

    if (character === "," && !inSingleQuote) {
      if (current.trim().length > 0) {
        parts.push(current.trim());
      }
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts;
}

function stripSafeLiteralCasts(value: string): string {
  return value
    .replace(/'([^']*)'::(?:text|varchar|character varying)/gi, "'$1'")
    .replace(/\b(true|false)\b::boolean/gi, "$1")
    .replace(/\b([0-9]+(?:\.[0-9]+)?)::(?:integer|bigint|numeric|double precision|real)/gi, "$1")
    .replace(/\(([a-z_][a-z0-9_]*)\)::(?:text|varchar|character varying)/gi, "$1")
    .replace(/\)::(?:text|varchar|character varying)\[\]/gi, ")");
}

function normalizeExpressionWhitespaceAndCase(value: string): string {
  const normalizedInput = value.replace(/\r\n/g, "\n");
  let result = "";
  let pendingWhitespace = false;
  let inSingleQuote = false;

  for (let index = 0; index < normalizedInput.length; index += 1) {
    const character = normalizedInput[index] ?? "";

    if (character === "'" && inSingleQuote && normalizedInput[index + 1] === "'") {
      result += "''";
      index += 1;
      continue;
    }

    if (character === "'") {
      inSingleQuote = !inSingleQuote;
      if (pendingWhitespace && result.length > 0) {
        result += " ";
      }
      pendingWhitespace = false;
      result += character;
      continue;
    }

    if (!inSingleQuote && /\s/.test(character)) {
      pendingWhitespace = true;
      continue;
    }

    if (pendingWhitespace && result.length > 0) {
      result += " ";
    }
    pendingWhitespace = false;
    result += inSingleQuote ? character : character.toLowerCase();
  }

  return result.trim();
}

function normalizeExpressionPunctuation(value: string): string {
  let result = "";
  let inSingleQuote = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index] ?? "";

    if (character === "'" && inSingleQuote && value[index + 1] === "'") {
      result += "''";
      index += 1;
      continue;
    }

    if (character === "'") {
      inSingleQuote = !inSingleQuote;
      result += character;
      continue;
    }

    if (inSingleQuote) {
      result += character;
      continue;
    }

    if (character === "(") {
      result += "(";
      while (value[index + 1] === " ") {
        index += 1;
      }
      continue;
    }

    if (character === ")") {
      result = result.trimEnd();
      result += ")";
      continue;
    }

    if (character === ",") {
      result = result.trimEnd();
      result += ", ";
      while (value[index + 1] === " ") {
        index += 1;
      }
      continue;
    }

    result += character;
  }

  return result.trim();
}

function normalizeBetweenExpression(value: string): string {
  return value.replace(
    /\b([a-z_][a-z0-9_]*)\s+between\s+([0-9]+(?:\.[0-9]+)?)\s+and\s+([0-9]+(?:\.[0-9]+)?)/gi,
    "$1 >= $2 and $1 <= $3"
  );
}

function normalizeMembershipExpression(value: string): string {
  return value
    .replace(/([a-z_][a-z0-9_]*)\s*=\s*any\s*\(\s*array\[([^\]]+)\]\s*\)/gi, (_match, left: string, entries: string) => {
      const normalizedEntries = splitExpressionList(entries).map((entry) => collapseWhitespace(stripSafeLiteralCasts(entry)));
      return `${left} in (${normalizedEntries.join(", ")})`;
    })
    .replace(/([a-z_][a-z0-9_]*)\s*<>\s*all\s*\(\s*array\[([^\]]+)\]\s*\)/gi, (_match, left: string, entries: string) => {
      const normalizedEntries = splitExpressionList(entries).map((entry) => collapseWhitespace(stripSafeLiteralCasts(entry)));
      return `${left} not in (${normalizedEntries.join(", ")})`;
    });
}

function stripAtomicParens(value: string): string {
  let result = value;
  let previous = "";

  while (result !== previous) {
    previous = result;
    result = result.replace(/\(([^()]+)\)/g, (match, inner: string) => {
      if (/\bor\b/i.test(inner)) {
        return match;
      }

      return inner.trim();
    });
  }

  return result;
}

export function normalizeSchemaExpression(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const collapsed = normalizeExpressionWhitespaceAndCase(unwrapOuterParens(value));
  const normalized = stripAtomicParens(
    normalizeBetweenExpression(normalizeMembershipExpression(stripSafeLiteralCasts(collapsed)))
  );
  return normalizeExpressionPunctuation(normalizeExpressionWhitespaceAndCase(unwrapOuterParens(normalized)));
}

function normalizeScalar(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeScalar(entry));
  }

  if (value && typeof value === "object") {
    return sortRecord(value as Record<string, unknown>);
  }

  if (typeof value === "string") {
    return collapseWhitespace(value);
  }

  return value;
}

function sortRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, normalizeScalar(value)])
  );
}

function normalizeStringArray(values: unknown, options?: { sortValues?: boolean; identifiers?: boolean }): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => (options?.identifiers ? normalizeSchemaIdentifier(value) : collapseWhitespace(value)));

  if (options?.sortValues) {
    normalized.sort((left, right) => left.localeCompare(right));
  }

  return normalized;
}

function normalizeMetadata(
  objectType: SchemaDefinitionObjectType,
  metadata: Record<string, unknown>
): Record<string, unknown> {
  switch (objectType) {
    case "table":
      return {
        columns: normalizeStringArray(metadata.columns, { identifiers: true })
      };
    case "column":
      return {
        dataType: normalizeType(metadata.dataType),
        defaultHash: typeof metadata.defaultHash === "string" ? metadata.defaultHash : null,
        hasDefault: normalizeBoolean(metadata.hasDefault),
        generationExpression: normalizeSchemaExpression(metadata.generationExpression),
        isGenerated: normalizeBoolean(metadata.isGenerated),
        isNullable: normalizeNullable(metadata.isNullable)
      };
    case "primary_key":
    case "unique_constraint":
      return {
        columns: normalizeStringArray(metadata.columns, { identifiers: true })
      };
    case "foreign_key":
      return {
        columns: normalizeStringArray(metadata.columns, { identifiers: true }),
        referencedColumns: normalizeStringArray(metadata.referencedColumns, { identifiers: true }),
        referencedTable:
          typeof metadata.referencedTable === "string" ? normalizeSchemaIdentifier(metadata.referencedTable) : null,
        onDelete: typeof metadata.onDelete === "string" ? collapseWhitespace(metadata.onDelete).toUpperCase() : null,
        onUpdate: typeof metadata.onUpdate === "string" ? collapseWhitespace(metadata.onUpdate).toUpperCase() : null
      };
    case "check_constraint":
      return {
        expression: normalizeSchemaExpression(metadata.expression)
      };
    case "index":
      return {
        columns: normalizeStringArray(metadata.columns, { identifiers: true }),
        method: typeof metadata.method === "string" ? collapseWhitespace(metadata.method).toLowerCase() : null,
        predicate: normalizeSchemaExpression(metadata.predicate),
        unique: normalizeBoolean(metadata.unique)
      };
    case "trigger":
      return {
        actionTiming:
          typeof metadata.actionTiming === "string" ? collapseWhitespace(metadata.actionTiming).toUpperCase() : null,
        enabled: normalizeBoolean(metadata.enabled),
        eventManipulation: normalizeStringArray(metadata.eventManipulation, { sortValues: true }),
        functionName:
          typeof metadata.functionName === "string" ? normalizeSchemaIdentifier(metadata.functionName) : null,
        level: typeof metadata.level === "string" ? collapseWhitespace(metadata.level).toUpperCase() : null
      };
    case "function":
      return {
        arguments: typeof metadata.arguments === "string" ? collapseWhitespace(metadata.arguments) : "",
        bodyHash: typeof metadata.bodyHash === "string" ? metadata.bodyHash : null,
        language: typeof metadata.language === "string" ? collapseWhitespace(metadata.language).toLowerCase() : null,
        leakproof: normalizeBoolean(metadata.leakproof),
        returnType: normalizeType(metadata.returnType),
        securityDefiner: normalizeBoolean(metadata.securityDefiner),
        strict: normalizeBoolean(metadata.strict),
        volatility: typeof metadata.volatility === "string" ? collapseWhitespace(metadata.volatility).toLowerCase() : null
      };
    case "sequence":
      return {
        dataType: normalizeType(metadata.dataType),
        increment: metadata.increment ?? null,
        maximumValue: metadata.maximumValue ?? null,
        minimumValue: metadata.minimumValue ?? null,
        startValue: metadata.startValue ?? null
      };
    case "policy":
      return {
        command: typeof metadata.command === "string" ? collapseWhitespace(metadata.command).toUpperCase() : null,
        permissive: normalizeBoolean(metadata.permissive),
        qualifierHash: typeof metadata.qualifierHash === "string" ? metadata.qualifierHash : null,
        qualifierPresent: normalizeBoolean(metadata.qualifierPresent),
        rolesHash: typeof metadata.rolesHash === "string" ? metadata.rolesHash : null,
        withCheckHash: typeof metadata.withCheckHash === "string" ? metadata.withCheckHash : null,
        withCheckPresent: normalizeBoolean(metadata.withCheckPresent)
      };
    case "extension":
      return {
        name: typeof metadata.name === "string" ? normalizeSchemaIdentifier(metadata.name) : null
      };
    case "comment":
      return {
        commentHash: typeof metadata.commentHash === "string" ? metadata.commentHash : null,
        targetType: typeof metadata.targetType === "string" ? collapseWhitespace(metadata.targetType).toLowerCase() : null
      };
    case "row_level_security":
      return {
        forceRowSecurity: normalizeBoolean(metadata.forceRowSecurity),
        rowSecurity: normalizeBoolean(metadata.rowSecurity)
      };
    default:
      return sortRecord(metadata);
  }
}

export function normalizeSchemaObject(object: SchemaLikeObject) {
  return {
    objectType: object.objectType,
    schemaName: normalizeSchemaIdentifier(object.schemaName),
    objectName: normalizeSchemaIdentifier(object.objectName),
    parentObject: object.parentObject ? normalizeSchemaIdentifier(object.parentObject) : null,
    metadata: normalizeMetadata(object.objectType, object.metadata)
  };
}
