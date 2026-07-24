import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildCanonicalMigrationManifest } from "../src/migration-parser.js";
import { reconcileMigration } from "../src/reconciliation-engine.js";
import { collectSchemaInventory } from "../src/schema-inventory.js";

const dockerExecutable = process.platform === "win32" ? "docker.exe" : "docker";
const repoRoot = join(process.cwd(), "..", "..");
const containerName = `exec-card-reconciliation-pg17-${process.pid}-${Date.now()}`;
const databaseName = "bidayax";
let hostPort: string | null = null;
let containerStarted = false;

const migrationFiles = [
  "0014_create_settings_persistence_layer.sql",
  "0015_create_identity_provider_integration.sql",
  "0016_create_telephony_domain_foundation.sql",
  "0017_create_cryptographic_trust_layer.sql"
];

function dockerIsLocal() {
  if (process.env.DOCKER_HOST && process.env.DOCKER_HOST.trim().length > 0) {
    return false;
  }

  const version = spawnSync(dockerExecutable, ["version"], { stdio: "ignore" });
  if (version.status !== 0) {
    return false;
  }

  const context = spawnSync(dockerExecutable, ["context", "show"], { encoding: "utf8" });
  if (context.status !== 0) {
    return false;
  }

  return ["default", "desktop-linux"].includes(context.stdout.trim());
}

function connectionString() {
  if (!hostPort) {
    throw new Error("Disposable PostgreSQL port was not assigned.");
  }

  return `postgres://postgres:postgres@127.0.0.1:${hostPort}/${databaseName}`;
}

function inspectHostPort() {
  const output = execFileSync(
    dockerExecutable,
    ["port", containerName, "5432/tcp"],
    { encoding: "utf8" }
  ).trim();
  const port = output.match(/127\.0\.0\.1:(\d+)$/)?.[1] ?? output.match(/0\.0\.0\.0:(\d+)$/)?.[1];
  if (!port) {
    throw new Error(`Unable to determine local PostgreSQL port from Docker output: ${output}`);
  }

  hostPort = port;
}

async function waitForDatabaseReady() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const client = new Client({ connectionString: connectionString() });
      await client.connect();
      await client.end();
      return;
    } catch {
      await delay(1000);
    }
  }

  throw new Error("Timed out waiting for disposable PostgreSQL 17.");
}

const describeIfLocalDocker = dockerIsLocal() ? describe : describe.skip;

describeIfLocalDocker("postgres reconciliation integration", () => {
  beforeAll(async () => {
    execFileSync(
      dockerExecutable,
      [
        "run",
        "--rm",
        "--name",
        containerName,
        "-d",
        "-e",
        "POSTGRES_PASSWORD=postgres",
        "-e",
        `POSTGRES_DB=${databaseName}`,
        "-p",
        "127.0.0.1::5432",
        "postgres:17-alpine"
      ],
      { stdio: "ignore" }
    );
    containerStarted = true;
    inspectHostPort();
    await waitForDatabaseReady();

    const client = new Client({ connectionString: connectionString() });
    await client.connect();

    try {
      for (const file of migrationFiles) {
        const sql = readFileSync(join(repoRoot, "database", "migrations", file), "utf8");
        await client.query(sql);
      }
    } finally {
      await client.end();
    }
  }, 120000);

  afterAll(() => {
    if (containerStarted) {
      execFileSync(dockerExecutable, ["rm", "-f", containerName], { stdio: "ignore" });
    }
  });

  it("reconciles canonical manifests 0014 through 0017 against a disposable PostgreSQL 17 schema", async () => {
    const inventory = await collectSchemaInventory(connectionString());
    const manifests = migrationFiles.map((file) =>
      buildCanonicalMigrationManifest(file, join(repoRoot, "database", "migrations", file))
    );
    const cumulativeObjects = manifests.flatMap((manifest) => manifest.objects);

    expect(inventory.objects.some((object) => object.objectType === "table" && object.objectName === "tenants")).toBe(
      true
    );

    for (const manifest of manifests) {
      const result = reconcileMigration(manifest, inventory.objects, [], cumulativeObjects);
      expect(result.classification, `${manifest.migrationId}: ${JSON.stringify(result)}`).toBe(
        "ALREADY_APPLIED_NOT_RECORDED"
      );
    }
  }, 120000);
});
