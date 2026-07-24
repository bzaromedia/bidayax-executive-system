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

  it("detects check constraint drift when logical grouping changes", () => {
    const checkManifest: CanonicalMigrationManifest = {
      ...manifest,
      objects: [
        ...manifest.objects,
        makeObject(
          "check_constraint",
          "tenant_membership_scope_check",
          { expression: "(A AND B) OR (C AND D)" },
          "tenants"
        )
      ]
    };
    const result = reconcileMigration(
      checkManifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants"),
        makeInventoryObject(
          "check_constraint",
          "tenant_membership_scope_check",
          { expression: "A AND (B OR C) AND D" },
          "tenants"
        )
      ],
      []
    );

    expect(result.classification).toBe("SCHEMA_DRIFT");
    expect(result.recommendedAction).toBe("MANUAL_REVIEW_REQUIRED");
  });

  it("detects check constraint drift when quoted identifier semantics differ", () => {
    const checkManifest: CanonicalMigrationManifest = {
      ...manifest,
      objects: [
        ...manifest.objects,
        makeObject("check_constraint", "quoted_identifier_check", { expression: '"Tenant_ID" IS NOT NULL' }, "tenants")
      ]
    };
    const result = reconcileMigration(
      checkManifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants"),
        makeInventoryObject(
          "check_constraint",
          "quoted_identifier_check",
          { expression: "tenant_id IS NOT NULL" },
          "tenants"
        )
      ],
      []
    );

    expect(result.classification).toBe("SCHEMA_DRIFT");
  });

  it("detects check constraint drift inside string literal content", () => {
    const checkManifest: CanonicalMigrationManifest = {
      ...manifest,
      objects: [
        ...manifest.objects,
        makeObject("check_constraint", "literal_content_check", { expression: "status <> 'needs review'" }, "tenants")
      ]
    };
    const result = reconcileMigration(
      checkManifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants"),
        makeInventoryObject(
          "check_constraint",
          "literal_content_check",
          { expression: "status <> 'needs  review'" },
          "tenants"
        )
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

  it("blocks baseline repair when live definition evidence is insufficient", () => {
    const result = reconcileMigration(
      manifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text" }, "tenants")
      ],
      []
    );

    expect(result.classification).toBe("BLOCKED");
    expect(result.recommendedAction).toBe("BLOCK");
    expect(result.compatibilityRisk).toBe("CRITICAL");
  });

  it("classifies an unexpected trigger on a canonical table as drift", () => {
    const result = reconcileMigration(
      manifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants"),
        makeInventoryObject(
          "trigger",
          "unexpected_security_trigger",
          {
            actionTiming: "BEFORE",
            enabled: true,
            eventManipulation: ["UPDATE"],
            functionName: "bypass_guard",
            level: "ROW"
          },
          "tenants"
        )
      ],
      []
    );

    expect(result.classification).toBe("SCHEMA_DRIFT");
    expect(result.recommendedAction).toBe("MANUAL_REVIEW_REQUIRED");
  });

  it("classifies an unexpected index on a canonical table as drift", () => {
    const result = reconcileMigration(
      manifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants"),
        makeInventoryObject(
          "index",
          "idx_tenants_unexpected",
          { columns: ["tenant_id"], method: "btree", predicate: null, unique: false },
          "tenants"
        )
      ],
      []
    );

    expect(result.classification).toBe("SCHEMA_DRIFT");
  });

  it("classifies an unexpected table comment on a canonical table as drift", () => {
    const result = reconcileMigration(
      manifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants"),
        makeInventoryObject("comment", "tenants", {
          targetType: "table",
          commentHash: "unexpected-comment-hash",
          commentPresent: true
        })
      ],
      []
    );

    expect(result.classification).toBe("SCHEMA_DRIFT");
  });

  it("classifies unexpected row-level-security state on a canonical table as drift", () => {
    const result = reconcileMigration(
      manifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants"),
        makeInventoryObject("row_level_security", "tenants", {
          forceRowSecurity: false,
          rowSecurity: true
        })
      ],
      []
    );

    expect(result.classification).toBe("SCHEMA_DRIFT");
  });

  it("allows explicitly known later canonical objects on a migration table", () => {
    const laterIndex = makeObject(
      "index",
      "idx_tenants_known_later",
      { columns: ["tenant_id"], method: "btree", predicate: null, unique: false },
      "tenants"
    );
    const result = reconcileMigration(
      manifest,
      [
        makeInventoryObject("table", "tenants", { columns: ["tenant_id"] }),
        makeInventoryObject("column", "tenant_id", { dataType: "text", isNullable: false }, "tenants"),
        makeInventoryObject(
          "index",
          "idx_tenants_known_later",
          { columns: ["tenant_id"], method: "btree", predicate: null, unique: false },
          "tenants"
        )
      ],
      [],
      [...manifest.objects, laterIndex]
    );

    expect(result.classification).toBe("ALREADY_APPLIED_NOT_RECORDED");
  });
});
