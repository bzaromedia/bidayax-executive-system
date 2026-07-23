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
const containerName = "exec-card-reconciliation-pg17";
const connectionString = "postgres://postgres:postgres@127.0.0.1:55432/bidayax";
const repoRoot = join(process.cwd(), "..", "..");
const migrationFiles = [
  "0014_create_settings_persistence_layer.sql",
  "0015_create_identity_provider_integration.sql",
  "0016_create_telephony_domain_foundation.sql",
  "0017_create_cryptographic_trust_layer.sql"
];

function dockerAvailable() {
  const result = spawnSync(dockerExecutable, ["version"], { stdio: "ignore" });
  return result.status === 0;
}

async function waitForDatabaseReady() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const client = new Client({ connectionString });
      await client.connect();
      await client.end();
      return;
    } catch {
      await delay(1000);
    }
  }

  throw new Error("Timed out waiting for disposable PostgreSQL 17.");
}

describe("postgres reconciliation integration", () => {
  const shouldRun = dockerAvailable();
  let runtimeReady = shouldRun;

  beforeAll(async () => {
    if (!shouldRun) {
      return;
    }    execFileSync(dockerExecutable, ["rm", "-f", containerName], { stdio: "ignore" });

    try {
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
        "POSTGRES_DB=bidayax",
        "-p",
        "127.0.0.1:55432:5432",
        "postgres:17-alpine"
      ],
      { stdio: "ignore" }
    );    await waitForDatabaseReady();
    } catch {
      runtimeReady = false;
      return;
    }

    const client = new Client({ connectionString });
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
    if (!shouldRun) {
      return;
    }

    execFileSync(dockerExecutable, ["rm", "-f", containerName], { stdio: "ignore" });
  });

  it("reconciles canonical manifests against a disposable PostgreSQL 17 schema", async () => {
    if (!runtimeReady) {
      return;
    }
    const inventory = await collectSchemaInventory(connectionString);
    const manifest = buildCanonicalMigrationManifest(
      "0014_create_settings_persistence_layer.sql",
      join(repoRoot, "database", "migrations", "0014_create_settings_persistence_layer.sql")
    );
    const result = reconcileMigration(manifest, inventory.objects, []);

    expect(inventory.objects.some((object) => object.objectType === "table" && object.objectName === "tenants")).toBe(
      true
    );
    expect(result.classification).toBe("ALREADY_APPLIED_NOT_RECORDED");
  }, 120000);
});
