import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

type Rule = {
  readonly label: string;
  readonly pattern: RegExp;
};

const productionDocFiles = new Set([
  "README.md",
  "FINAL_ENTERPRISE_ACCEPTANCE_REPORT.md",
  "docs/RELEASE_SCOPE.md",
  "docs/PHASE_STATUS.md",
  "docs/DEPLOYMENT_READINESS.md",
  "docs/SECURITY_RELEASE_REVIEW.md"
]);

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => {
    if (file.startsWith("docs/roadmap/")) {
      return false;
    }

    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file)) {
      return false;
    }

    if (file.includes("/tests/") || file.includes("\\tests\\")) {
      return false;
    }

    if (productionDocFiles.has(file)) {
      return true;
    }

    return (
      /^(apps\/card|apps\/dashboard)\//.test(file) &&
      /\.(ts|tsx|md)$/.test(file)
    );
  });

const requiredReleaseWording =
  "The Executive Card v1.0 includes only implemented, tested, production-buildable capabilities. Deferred enterprise trust layers are not active product capabilities in v1.0.";

const rules: readonly Rule[] = [
  { label: "placeholder", pattern: /\bplaceholder\b/i },
  { label: "mock data", pattern: /\bmock data\b/i },
  { label: "lorem ipsum", pattern: /lorem ipsum/i },
  { label: "TODO release", pattern: /TODO release/i },
  { label: "fake", pattern: /\bfake\b/i },
  { label: "coming soon in active UI", pattern: /coming soon/i },
  { label: "Phase hold", pattern: /phase hold|PHASE_1_HOLD/i },
  { label: "unsupported certification", pattern: /unsupported certification/i },
  {
    label: "active Specialist Agent Collective claim",
    pattern: /Specialist Agent Collective.{0,120}(active|implemented|production|available|included)/i
  },
  {
    label: "active full Data Trust Fabric claim",
    pattern: /full Data Trust Fabric.{0,120}(active|implemented|production|available|included)/i
  },
  {
    label: "active Verification Layer claim",
    pattern: /Verification Layer.{0,120}(active|implemented|production|available|included)/i
  },
  {
    label: "active IP Trust Fabric claim",
    pattern: /IP Trust Fabric.{0,120}(active|implemented|production|available|included)/i
  },
  {
    label: "active Bank Trust Layer claim",
    pattern: /Bank Trust Layer.{0,120}(active|implemented|production|available|included)/i
  },
  {
    label: "active Continuous Reverification claim",
    pattern: /Continuous Reverification.{0,120}(active|implemented|production|available|included)/i
  },
  {
    label: "active Enterprise Platform claim",
    pattern: /Enterprise Platform.{0,120}(active|implemented|production|available|included)/i
  },
  {
    label: "active Operational Excellence claim",
    pattern: /Operational Excellence.{0,120}(active|implemented|production|available|included)/i
  },
  {
    label: "active Technical Data Room claim",
    pattern: /Technical Data Room.{0,120}(active|implemented|production|available|included)/i
  },
  {
    label: "active Certification Readiness claim",
    pattern: /Certification Readiness.{0,120}(active|implemented|production|available|included)/i
  }
];

const errors: string[] = [];

for (const file of trackedFiles) {
  if (!existsSync(file)) {
    continue;
  }

  const lines = readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        errors.push(`${file}:${index + 1}: ${rule.label}`);
      }
    }
  });
}

for (const file of [
  "README.md",
  "docs/RELEASE_SCOPE.md",
  "docs/PHASE_STATUS.md",
  "FINAL_ENTERPRISE_ACCEPTANCE_REPORT.md"
]) {
  const content = existsSync(file) ? readFileSync(file, "utf8") : "";

  if (!content.includes(requiredReleaseWording)) {
    errors.push(`${file}: missing required v1.0 production truth wording.`);
  }
}

if (errors.length > 0) {
  console.error(
    JSON.stringify({
      component: "placeholder-verifier",
      errors,
      event: "placeholder_verification_failed",
      status: "failed"
    })
  );
  process.exit(1);
}

console.info(
  JSON.stringify({
    checkedFiles: trackedFiles.length,
    component: "placeholder-verifier",
    event: "placeholder_verification_passed",
    status: "passed"
  })
);
