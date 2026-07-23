import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { validateComposeSafety } from "../src/compose-safety.js";

const repoRoot = join(process.cwd(), "..", "..");

describe("compose safety validator", () => {
  it("passes on canonical hostinger compose", () => {
    const compose = readFileSync(join(repoRoot, "infrastructure", "docker", "docker-compose.hostinger.yml"), "utf8");
    const results = validateComposeSafety(compose);

    expect(results.every((result) => result.status === "PASSED")).toBe(true);
  });

  it("fails if the card host binding changes", () => {
    const results = validateComposeSafety('services:\n  card:\n    ports:\n      - "0.0.0.0:3000:3000"\n');

    expect(results.find((result) => result.invariant === "card-loopback-binding")?.status).toBe("FAILED");
  });

  it("fails if postgres is made public", () => {
    const results = validateComposeSafety('services:\n  postgres:\n    ports:\n      - "5432:5432"\n');

    expect(results.find((result) => result.invariant === "postgres-not-public")?.status).toBe("FAILED");
  });
});
