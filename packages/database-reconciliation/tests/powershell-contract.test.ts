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
});
