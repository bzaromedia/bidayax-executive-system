import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildCanonicalMigrationManifest } from "../src/migration-parser.js";

const repoRoot = join(process.cwd(), "..", "..");

describe("canonical migration manifests", () => {
  it("extracts reviewed objects from 0014", () => {
    const manifest = buildCanonicalMigrationManifest(
      "0014_create_settings_persistence_layer.sql",
      join(repoRoot, "database", "migrations", "0014_create_settings_persistence_layer.sql")
    );

    const objectNames = manifest.objects.map((object) => `${object.objectType}:${object.objectName}`);

    expect(objectNames).toContain("table:tenants");
    expect(objectNames).toContain("table:card_settings_versions");
    expect(objectNames).toContain("trigger:trg_card_settings_versions_tenant_match");
    expect(objectNames).toContain("function:enforce_settings_card_tenant_match");
    expect(manifest.lockRiskClassification).toBe("MODERATE");
  });

  it("extracts reviewed objects from 0017", () => {
    const manifest = buildCanonicalMigrationManifest(
      "0017_create_cryptographic_trust_layer.sql",
      join(repoRoot, "database", "migrations", "0017_create_cryptographic_trust_layer.sql")
    );

    const objectNames = manifest.objects.map((object) => `${object.objectType}:${object.objectName}`);

    expect(objectNames).toContain("table:trust_keys");
    expect(objectNames).toContain("table:trust_merkle_proofs");
    expect(objectNames).toContain("trigger:trg_trust_merkle_proofs_append_only");
    expect(objectNames).toContain("function:enforce_trust_audit_append_v1");
    expect(manifest.lockRiskClassification).toBe("HIGH");
  });
});
