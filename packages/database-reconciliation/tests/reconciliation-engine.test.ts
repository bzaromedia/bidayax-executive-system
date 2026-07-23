import { describe, expect, it } from "vitest";

import { definitionHash } from "../src/hash.js";
import { reconcileMigration } from "../src/reconciliation-engine.js";
import type { CanonicalMigrationManifest, SchemaInventoryObject } from "../src/types.js";

const manifest: CanonicalMigrationManifest = {
  migrationId: "0014_create_settings_persistence_layer.sql",
  sourceSha256: "abc",
  expectedDependencies: ["tenants"],
  expectedOrdering: ["tenants"],
  potentiallyDestructiveOperations: [],
  lockRiskClassification: "MODERATE",
  rollbackLimitations: [],
  objects: [
    {
      objectType: "table",
      schemaName: "public",
      objectName: "tenants",
      definitionHash: definitionHash({ table: "tenants", columns: ["tenant_id"] }),
      metadata: { columns: ["tenant_id"] }
    }
  ]
};

function table(metadata: Record<string, unknown>): SchemaInventoryObject {
  return {
    objectType: "table",
    schemaName: "public",
    objectName: "tenants",
    definitionHash: definitionHash({ objectType: "table", schemaName: "public", objectName: "tenants", metadata }),
    metadata
  };
}

describe("reconcileMigration", () => {
  it("classifies exact schema without ledger as baseline-only", () => {
    const result = reconcileMigration(manifest, [table({ columns: ["tenant_id"] })], []);

    expect(result.classification).toBe("ALREADY_APPLIED_NOT_RECORDED");
    expect(result.recommendedAction).toBe("BASELINE_LEDGER_ONLY");
  });

  it("classifies absent schema as not applied", () => {
    const result = reconcileMigration(manifest, [], ["0001"]);

    expect(result.classification).toBe("NOT_APPLIED");
    expect(result.recommendedAction).toBe("ELIGIBLE_FOR_CONTROLLED_APPLICATION");
  });

  it("classifies partial schema as corrective migration required", () => {
    const result = reconcileMigration(
      {
        ...manifest,
        objects: [
          ...manifest.objects,
          {
            objectType: "column",
            schemaName: "public",
            objectName: "tenant_id",
            parentObject: "tenants",
            definitionHash: definitionHash({ table: "tenants", column: "tenant_id" }),
            metadata: {}
          }
        ]
      },
      [table({ columns: [] })],
      []
    );

    expect(result.classification).toBe("PARTIALLY_APPLIED");
    expect(result.recommendedAction).toBe("CREATE_CORRECTIVE_MIGRATION");
  });
});
