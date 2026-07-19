import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routeFiles = [
  "app/api/telephony/inbound/route.ts",
  "app/api/telephony/outbound-requests/route.ts",
  "app/api/telephony/twilio/inbound/route.ts"
] as const;

function readSource(file: string) {
  return readFileSync(resolve(process.cwd(), file), "utf8");
}

function collectImportGraph(entryFile: string, seen = new Set<string>()) {
  const resolvedEntry = resolve(process.cwd(), entryFile);

  if (seen.has(resolvedEntry)) {
    return seen;
  }

  seen.add(resolvedEntry);

  const source = readFileSync(resolvedEntry, "utf8");
  const directory = dirname(resolvedEntry);
  const matches = source.matchAll(
    /\b(?:import|export)\b[\s\S]*?\bfrom\s+["']([^"']+)["']/g
  );

  for (const match of matches) {
    const specifier = match[1];

    if (!specifier?.startsWith(".")) {
      continue;
    }

    const candidate = resolve(directory, specifier.endsWith(".ts") ? specifier : `${specifier}.ts`);
    collectImportGraph(candidate, seen);
  }

  return seen;
}

describe("dashboard telephony route boundary", () => {
  it("keeps route files on the communications-owned gateway", () => {
    for (const file of routeFiles) {
      const source = readSource(file);

      expect(source).not.toContain("@bidayax/telephony");
      expect(source).toContain("communications-telephony-gateway");
    }
  });

  it("keeps the full transitive route import graph free of telephony adapter imports", () => {
    for (const file of routeFiles) {
      const graph = collectImportGraph(file);

      for (const dependency of graph) {
        const source = readFileSync(dependency, "utf8");

        expect(source).not.toContain("@bidayax/telephony");
      }
    }
  });

  it("keeps the gateway on communications-only disabled behavior during phase 11A", () => {
    const gatewaySource = readSource("src/lib/communications-telephony-gateway.ts");

    expect(gatewaySource).toContain("@bidayax/communications");
    expect(gatewaySource).not.toContain("@bidayax/telephony");
    expect(gatewaySource).toContain("phase11aExecutionDisabledReasonCode");
    expect(gatewaySource).toContain("Communications execution remains disabled in Phase 11A.");
  });
});