import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@bidayax/telemetry", () => ({
  createTelemetryError: vi.fn(),
  createTelemetryMetric: vi.fn(),
  writeTelemetryError: vi.fn().mockResolvedValue(undefined),
  writeTelemetryMetric: vi.fn().mockResolvedValue(undefined)
}));

describe("dashboard data empty-state behavior", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
  });

  it("returns a truthful unavailable state when DATABASE_URL is not configured", async () => {
    const { getDashboardData } = await import("./dashboard-queries");

    await expect(getDashboardData()).resolves.toMatchObject({
      recentInteractions: [],
      status: "not_configured",
      statusMessage:
        "DATABASE_URL is not configured. Connect PostgreSQL to view ledger activity.",
      totalInteractions: 0
    });
  });
});
