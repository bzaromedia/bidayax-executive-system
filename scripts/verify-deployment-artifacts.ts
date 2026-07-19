import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const dockerignore = read(".dockerignore");
for (const requiredEntry of ["**/.next", "**/node_modules", ".git"] as const) {
  assert(dockerignore.includes(requiredEntry), `.dockerignore must exclude ${requiredEntry} from Docker build contexts.`);
}

const dockerfiles = [
  "infrastructure/docker/Dockerfile.card",
  "infrastructure/docker/Dockerfile.dashboard"
] as const;

for (const dockerfile of dockerfiles) {
  const content = read(dockerfile);
  assert(
    content.includes("FROM node:22.17.0-alpine AS base"),
    `${dockerfile} must use the approved Node.js 22 Alpine image.`
  );
  assert(
    content.includes("corepack prepare pnpm@11.7.0 --activate"),
    `${dockerfile} must activate pnpm 11.7.0 deterministically.`
  );
}

const dashboardDockerfile = read("infrastructure/docker/Dockerfile.dashboard");
assert(
  dashboardDockerfile.includes("COPY services/communications services/communications"),
  "Dashboard Dockerfile must include the communications workspace required by @bidayax/dashboard."
);

const composeFiles = [
  "infrastructure/docker/docker-compose.hostinger.yml",
  "infrastructure/docker/docker-compose.production.yml"
] as const;

for (const composeFile of composeFiles) {
  const content = read(composeFile);
  assert(
    content.includes("/opt/the-executive-card/shared/env/production.env"),
    `${composeFile} must use the external production environment path.`
  );
  assert(
    !content.includes("../../.env.production"),
    `${composeFile} must not reference a repository-root production environment file.`
  );
  assert(content.includes('127.0.0.1:3100:3000'), `${composeFile} must bind the card only to loopback port 3100.`);
  assert(content.includes('127.0.0.1:3101:3001'), `${composeFile} must bind the dashboard only to loopback port 3101.`);
  assert(!/5432:5432/.test(content), `${composeFile} must not publish PostgreSQL to the host.`);
  assert(/migrate:\s*[\s\S]*profiles:\s*[\s\S]*-\s*migrate/.test(content), `${composeFile} must define the one-shot migrate profile.`);
  assert(/migrate:\s*[\s\S]*restart:\s*"no"/.test(content), `${composeFile} must configure migrate as a one-shot service with restart disabled.`);
}

const productionExample = read(".env.production.example");
for (const entry of [
  "TELEPHONY_PROVIDER=mock",
  "TELEPHONY_PROVIDER_MODE=disabled",
  "VOICE_RUNTIME_PROVIDER=none",
  "VOICE_AGENT_ENABLED=false",
  "LIVE_INBOUND_CALLS_ENABLED=false",
  "OUTBOUND_CALLS_ENABLED=false",
  "ALLOW_PRODUCTION_CALLS=false",
  "REQUIRE_HUMAN_APPROVAL=true"
] as const) {
  assert(productionExample.includes(entry), `.env.production.example must keep ${entry} in the production-safe state.`);
}

const caddyArtifact = read("infrastructure/caddy/the-executive-card.caddy");
for (const expected of [
  "theexecutivecard.online",
  "www.theexecutivecard.online",
  "dashboard.theexecutivecard.online",
  "reverse_proxy 127.0.0.1:3100",
  "reverse_proxy 127.0.0.1:3101",
  "/auth/callback",
  "/api/auth/webhooks/workos"
] as const) {
  assert(caddyArtifact.includes(expected), `Caddy artifact must contain ${expected}.`);
}

const systemdService = read("infrastructure/systemd/the-executive-card.service");
assert(systemdService.includes("EnvironmentFile=/opt/the-executive-card/shared/env/production.env"), "systemd service must reference the external environment file.");
assert(!/POSTGRES_PASSWORD|WORKOS_API_KEY|IDENTITY_TRANSACTION_ENCRYPTION_KEY|TWILIO_AUTH_TOKEN/.test(systemdService), "systemd service must not embed secrets.");

const runbook = read("docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md");
assert(runbook.includes("/opt/the-executive-card/shared/env/production.env"), "Production deployment runbook must direct operators to the external environment file.");
assert(!runbook.includes("commit .env.production"), "Production deployment runbook must not direct operators to commit production secrets.");

console.log("Deployment artifact verification passed.");
