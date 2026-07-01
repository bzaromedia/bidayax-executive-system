import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const requiredFiles = [
  "packages/tokens/src/colors.ts",
  "packages/tokens/src/typography.ts",
  "packages/tokens/src/spacing.ts",
  "packages/tokens/src/motion.ts",
  "packages/tokens/src/elevation.ts",
  "packages/tokens/src/radius.ts",
  "packages/design-system/governance/DESIGN_GOVERNANCE.md",
  "packages/design-system/accessibility/ACCESSIBILITY.md"
];

const errors: string[] = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    errors.push(`Missing design governance artifact: ${file}.`);
  }
}

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) =>
    /^(apps|packages|services)\//.test(file) &&
    /\.(css|ts|tsx|md)$/.test(file) &&
    !file.startsWith("packages/tokens/")
  );

for (const file of trackedFiles) {
  const content = readFileSync(file, "utf8");
  const matches = content.match(/#[0-9A-Fa-f]{3,8}\b/g);

  if (matches) {
    errors.push(`${file} contains hardcoded color values outside packages/tokens.`);
  }
}

if (errors.length > 0) {
  console.error(
    JSON.stringify({
      component: "design-governance-verifier",
      errors,
      event: "design_governance_verification_failed",
      status: "failed"
    })
  );
  process.exit(1);
}

console.info(
  JSON.stringify({
    checkedFiles: trackedFiles.length,
    component: "design-governance-verifier",
    event: "design_governance_verification_passed",
    status: "passed"
  })
);
