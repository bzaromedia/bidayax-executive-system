import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  canonicalize,
  CANONICALIZATION_VERSION,
  CanonicalizationError
} from "../canonicalization";
import { createDomainDigest, securityDomains } from "../domains";

describe("canonicalization", () => {
  it("matches the fixed vector with sorted keys, NFC, explicit null, and UTC timestamps", () => {
    const vector = canonicalize({
      z: null,
      "e\u0301": "e\u0301",
      nested: { b: 2, a: 1 },
      at: "2026-07-17T10:00:00-07:00"
    }, { schemaVersion: "fixed-vector-1" });

    expect(vector.canonicalizationVersion).toBe(CANONICALIZATION_VERSION);
    expect(vector.json).toBe('{"at":"2026-07-17T17:00:00.000Z","nested":{"a":1,"b":2},"z":null,"é":"é"}');
    expect(createHash("sha256").update(vector.bytes).digest("hex"))
      .toBe("336bcb33095d6ce1d70433ecd5dacef0bd0638d1741c4550caeaa993e821c74d");
  });

  it("preserves safe integers, decimal strings, booleans, arrays, and shared non-cyclic objects", () => {
    const shared = { cents: "12.50" };
    expect(canonicalize({ a: shared, b: shared, count: 2, enabled: false }, { schemaVersion: "1" }).json)
      .toBe('{"a":{"cents":"12.50"},"b":{"cents":"12.50"},"count":2,"enabled":false}');
  });

  it.each([
    [undefined, "undefined"],
    [() => true, "function"],
    [Symbol("x"), "symbol"],
    [1n, "bigint"],
    [Number.NaN, "non-finite-number"],
    [Number.POSITIVE_INFINITY, "non-finite-number"],
    [Number.MAX_SAFE_INTEGER + 1, "unsafe-integer"],
    [1.25, "floating-point-number"],
    [Buffer.from("binary"), "binary"],
    [new Uint8Array([1]), "binary"],
    [new Date("2026-07-17T00:00:00Z"), "non-plain-object"]
  ] as const)("rejects forbidden values %#", (value, code) => {
    expect(() => canonicalize({ value }, { schemaVersion: "1" }))
      .toThrowError(expect.objectContaining<Partial<CanonicalizationError>>({ code }));
  });

  it("rejects cycles and NFC key collisions", () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(() => canonicalize(cycle, { schemaVersion: "1" })).toThrowError(expect.objectContaining({ code: "cycle" }));
    expect(() => canonicalize({ "é": 1, "e\u0301": 2 }, { schemaVersion: "1" }))
      .toThrowError(expect.objectContaining({ code: "normalized-key-collision" }));
  });

  it("rejects sparse arrays, symbol keys, and invalid timestamp-shaped strings", () => {
    const sparse = new Array(2);
    sparse[1] = "present";
    expect(() => canonicalize(sparse, { schemaVersion: "1" })).toThrowError(expect.objectContaining({ code: "undefined" }));
    expect(() => canonicalize({ [Symbol("hidden")]: "value" }, { schemaVersion: "1" }))
      .toThrowError(expect.objectContaining({ code: "symbol" }));
    expect(() => canonicalize({ at: "2026-13-17T10:00:00Z" }, { schemaVersion: "1" }))
      .toThrowError(expect.objectContaining({ code: "invalid-timestamp" }));
  });

  it("does not elide accessors, non-enumerable properties, or __proto__ data keys", () => {
    const accessor = Object.defineProperty({}, "value", { enumerable: true, get: () => "hidden" });
    expect(() => canonicalize(accessor, { schemaVersion: "1" }))
      .toThrowError(expect.objectContaining({ code: "function" }));
    const nonEnumerable = Object.defineProperty({}, "value", { enumerable: false, value: "hidden" });
    expect(() => canonicalize(nonEnumerable, { schemaVersion: "1" }))
      .toThrowError(expect.objectContaining({ code: "non-plain-object" }));
    expect(canonicalize(JSON.parse('{"__proto__":"data"}'), { schemaVersion: "1" }).json)
      .toBe('{"__proto__":"data"}');
  });

  it("enforces versions, schema version, and maximum bytes", () => {
    expect(() => canonicalize({}, { canonicalizationVersion: "2", schemaVersion: "1" })).toThrowError(expect.objectContaining({ code: "unsupported-version" }));
    expect(() => canonicalize({}, { schemaVersion: " " })).toThrowError(expect.objectContaining({ code: "invalid-schema-version" }));
    expect(() => canonicalize({}, { maxBytes: 0, schemaVersion: "1" })).toThrowError(expect.objectContaining({ code: "invalid-max-bytes" }));
    expect(() => canonicalize({ long: "value" }, { maxBytes: 2, schemaVersion: "1" })).toThrowError(expect.objectContaining({ code: "max-bytes-exceeded" }));
  });
});

describe("typed security domain registry", () => {
  const binding = { artifactId: "artifact-1", artifactType: "settings", artifactVersion: "7", cardId: "card-1", payload: { enabled: true, nullable: null }, schemaVersion: "settings-1", tenantId: "tenant-1" } as const;

  it("contains every exact domain and produces distinct registered digests", () => {
    expect(securityDomains).toHaveLength(30);
    const digests = securityDomains.map((domain) => createDomainDigest({ ...binding, domain }));
    expect(new Set(digests)).toHaveLength(securityDomains.length);
  });

  it("matches the fixed settings.snapshot vector", () => {
    expect(createDomainDigest({ ...binding, domain: "settings.snapshot" })).toBe("0149069bd397ea549f3f62c98870d10d2096cc94577650a36ae69faa1e05593d");
  });

  it("binds every required field and rejects unregistered domains", () => {
    const baselineInput = { ...binding, domain: "settings.snapshot" as const };
    const baseline = createDomainDigest(baselineInput);
    const variants = [
      { ...baselineInput, domain: "brand.tokens.snapshot" as const }, { ...baselineInput, schemaVersion: "settings-2" },
      { ...baselineInput, tenantId: "tenant-2" }, { ...baselineInput, cardId: null }, { ...baselineInput, artifactType: "other" },
      { ...baselineInput, artifactId: "artifact-2" }, { ...baselineInput, artifactVersion: "8" }, { ...baselineInput, payload: { enabled: false } }
    ];
    for (const variant of variants) expect(createDomainDigest(variant)).not.toBe(baseline);
    expect(() => createDomainDigest({ ...binding, domain: "unregistered.domain" })).toThrowError(expect.objectContaining({ code: "unregistered-domain" }));
  });
});
