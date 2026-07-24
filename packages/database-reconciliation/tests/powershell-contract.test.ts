import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const scripts = [
  "invoke-preflight.ps1",
  "invoke-schema-inventory.ps1",
  "invoke-env-contract-check.ps1",
  "invoke-compose-safety-check.ps1",
  "invoke-image-preservation.ps1",
  "invoke-release-materialization.ps1",
  "invoke-service-upgrade.ps1",
  "invoke-post-upgrade-validation.ps1",
  "invoke-rollback.ps1"
] as const;

const repoRoot = join(process.cwd(), "..", "..");

describe("powershell contract", () => {
  it("enforces strict mode and avoids postgres dollar-quoting", () => {
    for (const script of scripts) {
      const content = readFileSync(join(repoRoot, "scripts", "production-reconciliation", script), "utf8");

      expect(content).toContain("Set-StrictMode -Version Latest");
      expect(content).not.toContain("$$");
    }
  });

  it("requires explicit operator scope for host and compose safety", () => {
    const preflight = readFileSync(join(repoRoot, "scripts", "production-reconciliation", "invoke-preflight.ps1"), "utf8");
    const composeSafety = readFileSync(join(repoRoot, "scripts", "production-reconciliation", "invoke-compose-safety-check.ps1"), "utf8");
    const imagePreservation = readFileSync(join(repoRoot, "scripts", "production-reconciliation", "invoke-image-preservation.ps1"), "utf8");
    const schemaInventory = readFileSync(join(repoRoot, "scripts", "production-reconciliation", "invoke-schema-inventory.ps1"), "utf8");
    const releaseMaterialization = readFileSync(join(repoRoot, "scripts", "production-reconciliation", "invoke-release-materialization.ps1"), "utf8");
    const serviceUpgrade = readFileSync(join(repoRoot, "scripts", "production-reconciliation", "invoke-service-upgrade.ps1"), "utf8");
    const postUpgrade = readFileSync(join(repoRoot, "scripts", "production-reconciliation", "invoke-post-upgrade-validation.ps1"), "utf8");
    const rollback = readFileSync(join(repoRoot, "scripts", "production-reconciliation", "invoke-rollback.ps1"), "utf8");

    expect(preflight).toContain("[Parameter(Mandatory = $true)]");
    expect(preflight).toContain("[string]$TargetHost");
    expect(schemaInventory).toContain("[string]$TargetHost");
    expect(schemaInventory).toContain("[string]$ComposeProject");
    expect(composeSafety).toContain("[string]$ActualProjectName");
    expect(composeSafety).not.toContain("$ExpectedComposeProject");
    expect(imagePreservation).toContain("[string]$ExpectedImageId");
    expect(imagePreservation).toContain("[string]$ObservedImageId");
    expect(releaseMaterialization).toContain("[string]$OperatorAuthorizationReference");
    expect(serviceUpgrade).toContain("[string]$ComposeFilePath");
    expect(postUpgrade).toContain("[string]$OperatorAuthorizationReference");
    expect(rollback).toContain("[string]$OperatorAuthorizationReference");
  });

  it("does not pass database connection strings through schema inventory argv", () => {
    const schemaInventory = readFileSync(join(repoRoot, "scripts", "production-reconciliation", "invoke-schema-inventory.ps1"), "utf8");

    expect(schemaInventory).not.toContain("$ConnectionString");
    expect(schemaInventory).toContain("$env:DATABASE_URL");
    expect(schemaInventory).not.toContain("schema-inventory.ts\") $");
  });

  it("fails closed after CLI-backed checks return nonzero", () => {
    for (const script of [
      "invoke-schema-inventory.ps1",
      "invoke-env-contract-check.ps1",
      "invoke-compose-safety-check.ps1",
      "invoke-image-preservation.ps1"
    ]) {
      const content = readFileSync(join(repoRoot, "scripts", "production-reconciliation", script), "utf8");
      expect(content).toContain("$LASTEXITCODE -ne 0");
      expect(content).toContain("throw");
    }
  });
});
