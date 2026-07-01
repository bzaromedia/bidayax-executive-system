import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) =>
    /^(README\.md|docs\/|apps\/.*\.(ts|tsx|md)|packages\/.*\.(ts|tsx|md)|services\/.*\.md)/.test(
      file
    )
  );

const disallowedPatterns: ReadonlyArray<{ readonly pattern: RegExp; readonly message: string }> = [
  {
    pattern: /BidayaX Executive System/i,
    message: "Old public product name must not be used."
  },
  {
    pattern: /fully live AI receptionist/i,
    message: "The v1.0 scope does not include a fully live AI receptionist."
  },
  {
    pattern: /production telephony is enabled/i,
    message: "Production telephony is not enabled by default."
  },
  {
    pattern: /live voice is enabled/i,
    message: "Live voice is preparation/safety-gated only in v1.0."
  },
  {
    pattern: /autonomous agents are active/i,
    message: "Autonomous production agents are not active in v1.0."
  },
  {
    pattern: /compliance certified|certification certified|formally certified/i,
    message: "The repository must not claim compliance certification."
  },
  {
    pattern: /(Bank Trust Layer|IP Trust Fabric|Verification Layer|Specialist Agent Collective).{0,80}(implemented|complete|active in production)/i,
    message: "Deferred enterprise trust layers must not be described as implemented."
  }
];

const errors: string[] = [];

for (const file of trackedFiles) {
  if (!existsSync(file)) {
    continue;
  }

  const lines = readFileSync(file, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const { message, pattern } of disallowedPatterns) {
      if (pattern.test(line)) {
        errors.push(`${file}:${index + 1}: ${message}`);
      }
    }
  });
}

if (errors.length > 0) {
  console.error(
    JSON.stringify({
      component: "public-claims-verifier",
      errors,
      event: "public_claims_verification_failed",
      status: "failed"
    })
  );
  process.exit(1);
}

console.info(
  JSON.stringify({
    checkedFiles: trackedFiles.length,
    component: "public-claims-verifier",
    event: "public_claims_verification_passed",
    status: "passed"
  })
);
