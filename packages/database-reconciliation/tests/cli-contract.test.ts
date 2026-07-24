import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

const repoRoot = join(process.cwd(), "..", "..");
const nodeExecutable = process.execPath;
const artifactRoot = join(repoRoot, "artifacts", "database-reconciliation-cli-tests");

function runNodeCli(script: string, args: string[] = [], environment?: Record<string, string | undefined>) {
  return spawnSync(nodeExecutable, ["--experimental-strip-types", script, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...environment
    }
  });
}

function writeFixture(name: string, content: string) {
  mkdirSync(artifactRoot, { recursive: true });
  const filePath = join(artifactRoot, name);
  writeFileSync(filePath, content, "utf8");
  return filePath;
}

describe("database reconciliation CLI contracts", () => {
  afterAll(() => {
    rmSync(artifactRoot, { force: true, recursive: true });
  });

  it("exits nonzero for unsafe compose reports", () => {
    const composeFile = writeFixture(
      "unsafe-compose.yml",
      `services:
  postgres:
    ports:
      - "127.0.0.1:5432:5432"
volumes:
  wrong:
networks:
  wrong:
`
    );

    const result = runNodeCli("packages/database-reconciliation/src/cli/compose-safety.ts", [
      composeFile,
      "wrong-project"
    ]);

    expect(result.status).toBe(2);
    expect(result.stdout).toContain("\"status\": \"FAILED\"");
  });

  it("exits nonzero for invalid image preservation plans", () => {
    const result = runNodeCli("packages/database-reconciliation/src/cli/image-preservation.ts", [
      "card",
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      "the-executive-card-card:rollback-20260722"
    ]);

    expect(result.status).toBe(2);
    expect(result.stdout).toContain("\"equalityResult\": \"INVALID\"");
  });

  it("requires schema inventory credentials through environment only", () => {
    const result = runNodeCli("packages/database-reconciliation/src/cli/schema-inventory.ts", [
      "postgres://user:password@example.invalid/db"
    ], {
      DATABASE_URL: ""
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("DATABASE_URL is required");
  });
});
