import { Buffer } from "node:buffer";

export const CANONICALIZATION_VERSION = "bidayax-c14n-1" as const;
export const DEFAULT_SCHEMA_VERSION = "1" as const;
export const DEFAULT_MAX_CANONICAL_BYTES = 1_048_576;

export type CanonicalPrimitive = string | number | boolean | null;
export type CanonicalValue = CanonicalPrimitive | readonly CanonicalValue[] | { readonly [key: string]: CanonicalValue };

export type CanonicalizationOptions = {
  readonly canonicalizationVersion?: string;
  readonly maxBytes?: number;
  readonly schemaVersion: string;
};

export type Canonicalized = {
  readonly bytes: Uint8Array;
  readonly canonicalizationVersion: typeof CANONICALIZATION_VERSION;
  readonly json: string;
  readonly schemaVersion: string;
};

export type CanonicalizationErrorCode =
  | "unsupported-version"
  | "invalid-schema-version"
  | "invalid-max-bytes"
  | "undefined"
  | "function"
  | "symbol"
  | "bigint"
  | "non-finite-number"
  | "unsafe-integer"
  | "floating-point-number"
  | "binary"
  | "invalid-timestamp"
  | "cycle"
  | "non-plain-object"
  | "normalized-key-collision"
  | "max-bytes-exceeded";

export class CanonicalizationError extends Error {
  constructor(readonly code: CanonicalizationErrorCode, message: string) {
    super(message);
    this.name = "CanonicalizationError";
  }
}

const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

function normalizeString(value: string): string {
  const normalized = value.normalize("NFC");
  if (!timestampPattern.test(normalized)) return normalized;
  const milliseconds = Date.parse(normalized);
  if (Number.isNaN(milliseconds)) {
    throw new CanonicalizationError("invalid-timestamp", `Invalid ISO timestamp: ${normalized}`);
  }
  return new Date(milliseconds).toISOString();
}

export function canonicalUtcTimestamp(value: string): string {
  if (!timestampPattern.test(value.normalize("NFC"))) {
    throw new CanonicalizationError("invalid-timestamp", `Timestamp must include an explicit UTC or offset designator: ${value}`);
  }
  return normalizeString(value);
}

function canonicalNode(value: unknown, ancestors: Set<object>, path: string): CanonicalValue {
  if (value === null) return null;
  if (typeof value === "string") return normalizeString(value);
  if (typeof value === "boolean") return value;
  if (typeof value === "undefined") throw new CanonicalizationError("undefined", `Undefined is forbidden at ${path}`);
  if (typeof value === "function") throw new CanonicalizationError("function", `Functions are forbidden at ${path}`);
  if (typeof value === "symbol") throw new CanonicalizationError("symbol", `Symbols are forbidden at ${path}`);
  if (typeof value === "bigint") throw new CanonicalizationError("bigint", `BigInts are forbidden at ${path}; use a decimal string`);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new CanonicalizationError("non-finite-number", `Non-finite numbers are forbidden at ${path}`);
    if (!Number.isInteger(value)) throw new CanonicalizationError("floating-point-number", `Floating-point numbers are forbidden at ${path}; use a decimal string`);
    if (!Number.isSafeInteger(value)) throw new CanonicalizationError("unsafe-integer", `Unsafe integers are forbidden at ${path}; use a decimal string`);
    return Object.is(value, -0) ? 0 : value;
  }

  if (Buffer.isBuffer(value) || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    throw new CanonicalizationError("binary", `Binary values are forbidden at ${path}`);
  }
  if (typeof value !== "object") {
    throw new CanonicalizationError("non-plain-object", `Unsupported value at ${path}`);
  }
  if (ancestors.has(value)) throw new CanonicalizationError("cycle", `Cycle detected at ${path}`);
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const ownKeys = Reflect.ownKeys(value);
      if (ownKeys.some((key) => typeof key === "symbol")) {
        throw new CanonicalizationError("symbol", `Symbol keys are forbidden at ${path}`);
      }
      for (const key of ownKeys) {
        if (key !== "length" && !/^(0|[1-9]\d*)$/.test(key as string)) {
          throw new CanonicalizationError("non-plain-object", `Named array properties are forbidden at ${path}.${String(key)}`);
        }
        if (key !== "length") {
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          if (descriptor?.get || descriptor?.set) {
            throw new CanonicalizationError("function", `Accessors are forbidden at ${path}[${String(key)}]`);
          }
          if (descriptor?.enumerable !== true) {
            throw new CanonicalizationError("non-plain-object", `Non-enumerable array elements are forbidden at ${path}[${String(key)}]`);
          }
        }
      }
      return Array.from({ length: value.length }, (_, index) => {
        if (!(index in value)) throw new CanonicalizationError("undefined", `Sparse arrays are forbidden at ${path}[${index}]`);
        return canonicalNode(value[index], ancestors, `${path}[${index}]`);
      });
    }
    const prototype = Object.getPrototypeOf(value) as object | null;
    if (prototype !== Object.prototype && prototype !== null) {
      throw new CanonicalizationError("non-plain-object", `Only plain objects are permitted at ${path}`);
    }
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key === "symbol")) {
      throw new CanonicalizationError("symbol", `Symbol keys are forbidden at ${path}`);
    }
    const stringKeys = ownKeys as string[];
    for (const key of stringKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor?.get || descriptor?.set) {
        throw new CanonicalizationError("function", `Accessors are forbidden at ${path}.${key}`);
      }
      if (descriptor?.enumerable !== true) {
        throw new CanonicalizationError("non-plain-object", `Non-enumerable properties are forbidden at ${path}.${key}`);
      }
    }
    const normalizedEntries = stringKeys.map((key) => [key.normalize("NFC"), key] as const);
    normalizedEntries.sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
    const result = Object.create(null) as Record<string, CanonicalValue>;
    let previous: string | undefined;
    for (const [normalizedKey, originalKey] of normalizedEntries) {
      if (normalizedKey === previous) {
        throw new CanonicalizationError("normalized-key-collision", `NFC key collision at ${path}.${normalizedKey}`);
      }
      previous = normalizedKey;
      result[normalizedKey] = canonicalNode((value as Record<string, unknown>)[originalKey], ancestors, `${path}.${normalizedKey}`);
    }
    return result;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalize(value: unknown, options: CanonicalizationOptions): Canonicalized {
  if ((options.canonicalizationVersion ?? CANONICALIZATION_VERSION) !== CANONICALIZATION_VERSION) {
    throw new CanonicalizationError("unsupported-version", "Unsupported canonicalization version");
  }
  if (!options.schemaVersion.trim()) throw new CanonicalizationError("invalid-schema-version", "Schema version is required");
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_CANONICAL_BYTES;
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new CanonicalizationError("invalid-max-bytes", "maxBytes must be a positive safe integer");
  }
  const json = JSON.stringify(canonicalNode(value, new Set<object>(), "$"));
  const bytes = Buffer.from(json, "utf8");
  if (bytes.byteLength > maxBytes) {
    throw new CanonicalizationError("max-bytes-exceeded", `Canonical form is ${bytes.byteLength} bytes; maximum is ${maxBytes}`);
  }
  return { bytes, canonicalizationVersion: CANONICALIZATION_VERSION, json, schemaVersion: options.schemaVersion };
}
