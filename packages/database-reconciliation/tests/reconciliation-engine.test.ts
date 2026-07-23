import { describe, expect, it } from "vitest";

import { buildSchemaDefinitionHash } from "../src/schema-definition-hash.js";
import { reconcileMigration } from "../src/reconciliation-engine.js";
import type { CanonicalManifestObject, CanonicalMigrationManifest, SchemaInventoryObject } from "../src/types.js";

function makeObject(
  objectType: CanonicalManifestObject["objectType"],
  objectName: string,
  metadata: Record<string, unknown>,
  parentObject?: string
): CanonicalManifestObject {
  const object: CanonicalManifestObject = {
    objectType,
    schemaName: "public",
    objectName,
    ...(parentObject ? { parentObject } : {}),
    definitionHash: "",
    metadata
  };

  object.definitionHash = buildSchemaDefinitionHash(object);
  return object;
}

function makeInventoryObject(
  objectType: SchemaInventoryObject["objectType"],
  objectName: string,
  metadata: Record<string, unknown>,
  parentObject?: string
): SchemaInventoryObject {
  const object: SchemaInventoryObject = {
    objectType,
    schemaName: "public",
    objectName,
    ...(parentObject ? { parentObject } : {}),
    definitionHash: "",
    metadata
  };

  object.definitionHash = buildSchemaDefinitionHash(object);
  return object;
}

const manifest: CanonicalMigrationManifest = {
  migrationId: "0014_create_settings_persistence_layer.sql",
  sourceSha256: "abc",
  expectedDependencies: ["tenants"],
  expectedOrdering: ["tenants"],
  potentiallyDestructiveOperations: [],
  lockRiskClassification: "MODERATE",
  rollbackLimitations: [],
  objects: [
    makeObject("table", "tenants", { columns: ["tenant_id"] }),
    makeObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants")
  ]
};

describe("reconcileMigration", () => {
  it("classifies exact schema without ledger as baseline-only", () => {
    const result = reconcileMigration(
      manifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants")
      ],
      []
    );

    expect(result.classification).toBe("ALREADY_APPLIED_NOT_RECORDED");
    expect(result.recommendedAction).toBe("BASELINE_LEDGER_ONLY");
  });

  it("classifies absent schema as not applied", () => {
    const result = reconcileMigration(manifest, [], ["0001"]);

    expect(result.classification).toBe("NOT_APPLIED");
    expect(result.recommendedAction).toBe("ELIGIBLE_FOR_CONTROLLED_APPLICATION");
  });

  it("detects definition drift instead of treating a key match as exact", () => {
    const result = reconcileMigration(
      manifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "uuid", isNullable: false }, "tenants")
      ],
      []
    );

    expect(result.classification).toBe("SCHEMA_DRIFT");
  });

  it("detects extra scoped objects on a canonical table as drift", () => {
    const result = reconcileMigration(
      manifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants"),
        makeInventoryObject("column", "unexpected_column", { dataType: "text", isNullable: true }, "tenants")
      ],
      []
    );

    expect(result.classification).toBe("SCHEMA_DRIFT");
  });

  it("classifies missing scoped objects as partially applied", () => {
    const result = reconcileMigration(
      manifest,
      [makeInventoryObject("table", "tenants", { columns: ["tenant_id"] })],
      []
    );

    expect(result.classification).toBe("PARTIALLY_APPLIED");
    expect(result.recommendedAction).toBe("CREATE_CORRECTIVE_MIGRATION");
  });
});
