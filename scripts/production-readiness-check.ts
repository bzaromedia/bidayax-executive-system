import { readdir } from "node:fs/promises";
import { join } from "node:path";

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

const envWarnings: string[] = [];
const envErrors: string[] = [];
const nodeEnv = process.env.NODE_ENV ?? "development";
const databaseUrl = process.env.DATABASE_URL ?? "";
const telephonyProvider = process.env.TELEPHONY_PROVIDER ?? "mock";
const voiceTestMode = readBoolean(process.env.VOICE_TEST_MODE, true);
const allowProductionCalls = readBoolean(process.env.ALLOW_PRODUCTION_CALLS, false);
const outboundCallsEnabled = readBoolean(process.env.OUTBOUND_CALLS_ENABLED, false);
const voiceAgentEnabled = readBoolean(process.env.VOICE_AGENT_ENABLED, false);

if (nodeEnv === "production" && !databaseUrl) {
  envErrors.push("DATABASE_URL is required in production.");
}

if (!databaseUrl) {
  envWarnings.push("DATABASE_URL is not configured. Database-backed readiness will be degraded.");
}

if (telephonyProvider === "mock") {
  envWarnings.push(
    "Telephony is a safety-gated future integration. Live provider integration remains inactive."
  );
}

if (!allowProductionCalls) {
  envWarnings.push("Production calls are disabled by default.");
}

if (allowProductionCalls && voiceTestMode) {
  envErrors.push("ALLOW_PRODUCTION_CALLS cannot be true while VOICE_TEST_MODE is true.");
}

if (allowProductionCalls && !voiceAgentEnabled) {
  envErrors.push("ALLOW_PRODUCTION_CALLS requires VOICE_AGENT_ENABLED=true.");
}

const migrations = (await readdir(join(process.cwd(), "database", "migrations")))
  .filter((file) => file.endsWith(".sql"))
  .sort();

const checks = [
  {
    name: "environment_validation",
    status: envErrors.length > 0 ? "failed" : envWarnings.length > 0 ? "warning" : "passed",
    details: [...envErrors, ...envWarnings]
  },
  {
    name: "migration_files_present",
    status: migrations.length >= 6 ? "passed" : "failed",
    details: [`${migrations.length} migration files detected.`]
  },
  {
    name: "safe_voice_defaults",
    status:
      outboundCallsEnabled === false &&
      voiceTestMode === true &&
      allowProductionCalls === false
        ? "passed"
        : "failed",
    details: ["Production voice must remain blocked unless explicitly enabled."]
  }
];

const failed = checks.some((check) => check.status === "failed");

console.info(
  JSON.stringify({
    checks,
    component: "production-readiness-check",
    event: failed ? "production_readiness_failed" : "production_readiness_completed",
    status: failed ? "not_ready" : "ready"
  })
);

if (failed) {
  process.exit(1);
}
