import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const errors: string[] = [];
const warnings: string[] = [];

const requiredDocs = [
  "README.md",
  "docs/PHASE_STATUS.md",
  "docs/RELEASE_SCOPE.md",
  "docs/DEPLOYMENT_READINESS.md",
  "docs/SECURITY_RELEASE_REVIEW.md",
  "docs/RECOVERY_PHASE_B_ENTERPRISE_COMPLETION_GATE.md"
];

for (const doc of requiredDocs) {
  if (!existsSync(doc)) {
    errors.push(`Missing release-scope document: ${doc}.`);
  }
}

const allowedStatuses = [
  "implemented",
  "partial",
  "deferred",
  "blocked",
  "removed_from_release_scope"
] as const;

if (existsSync("docs/PHASE_STATUS.md")) {
  const phaseStatus = readFileSync("docs/PHASE_STATUS.md", "utf8");

  for (let phase = 1; phase <= 24; phase += 1) {
    const phasePattern = new RegExp(`\\|\\s*${phase}\\s*\\|[^\\n]+\\|\\s*(${allowedStatuses.join("|")})\\s*\\|`);

    if (!phasePattern.test(phaseStatus)) {
      errors.push(`docs/PHASE_STATUS.md is missing phase ${phase} with an allowed status.`);
    }
  }
}

const generatedPathPatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)\.next-build\//,
  /(^|\/)\.pnpm-store\//,
  /(^|\/)pnpm-store\//,
  /(^|\/)dist\//,
  /(^|\/)storybook-static\//,
  /\.tsbuildinfo$/
];

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

for (const file of trackedFiles) {
  if (generatedPathPatterns.some((pattern) => pattern.test(file))) {
    errors.push(`Generated artifact is tracked: ${file}.`);
  }
}

const secretPatterns = [
  /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /TWILIO_AUTH_TOKEN[ \t]*=[ \t]*(?!$|replace|your-|test-|example|placeholder)[^\r\n\s]+/im,
  /OPENAI_API_KEY[ \t]*=[ \t]*(?!$|replace|your-|test-|example|placeholder)[^\r\n\s]+/im
];

for (const file of trackedFiles) {
  if (file === "pnpm-lock.yaml") {
    continue;
  }

  const content = readFileSync(file, "utf8");

  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      errors.push(`Potential hardcoded secret detected in ${file}.`);
      break;
    }
  }
}

const migrationPattern = /^(\d{4})_[a-z0-9_]+\.sql$/;
const migrationsDir = join(process.cwd(), "database", "migrations");

if (existsSync(migrationsDir)) {
  const migrations = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  migrations.forEach((file, index) => {
    const match = migrationPattern.exec(file);
    const expected = String(index + 1).padStart(4, "0");

    if (!match) {
      errors.push(`Migration ${file} does not match 0000_name.sql.`);
    } else if (match[1] !== expected) {
      errors.push(`Migration order mismatch: expected ${expected}, found ${match[1]}.`);
    }
  });

  if (migrations.length < 8) {
    errors.push(`Expected at least 8 v1.0 migrations, found ${migrations.length}.`);
  }
} else {
  errors.push("Missing database/migrations directory.");
}

if (existsSync("docs/RELEASE_SCOPE.md")) {
  const releaseScope = readFileSync("docs/RELEASE_SCOPE.md", "utf8");

  for (const deferredName of [
    "Specialist Agent Collective",
    "Verification Layer",
    "IP Trust Fabric",
    "Bank Trust Layer",
    "Certification Readiness"
  ]) {
    if (!releaseScope.includes(deferredName)) {
      warnings.push(`Release scope does not explicitly mention deferred system: ${deferredName}.`);
    }
  }
}

if (errors.length > 0) {
  console.error(
    JSON.stringify({
      component: "release-scope-verifier",
      errors,
      event: "release_scope_verification_failed",
      status: "failed",
      warnings
    })
  );
  process.exit(1);
}

console.info(
  JSON.stringify({
    component: "release-scope-verifier",
    event: "release_scope_verification_passed",
    status: "passed",
    warnings
  })
);
