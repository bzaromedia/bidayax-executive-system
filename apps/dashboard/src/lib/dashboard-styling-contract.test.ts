import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readDashboardFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("dashboard styling contract", () => {
  it("loads the dashboard globals stylesheet from the root layout", () => {
    const source = readDashboardFile("app/layout.tsx");

    expect(source).toContain('import "./globals.css";');
  });

  it("declares Tailwind v4 sources for dashboard and shared UI files", () => {
    const source = readDashboardFile("app/globals.css");

    expect(source).toContain('@source "../app";');
    expect(source).toContain('@source "../src";');
    expect(source).toContain('@source "../../../packages/ui/src";');
  });

  it("keeps the interactions route on the governed dashboard shell and truthful status surfaces", () => {
    const source = readDashboardFile("app/interactions/page.tsx");

    expect(source).toContain("DashboardShell");
    expect(source).toContain("EmptyState");
    expect(source).toContain("TelephonyReadinessSummary");
    expect(source).toContain("ProductionHardeningWarnings");
  });
});
