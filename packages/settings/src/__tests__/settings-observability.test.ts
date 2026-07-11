import { describe, expect, it } from "vitest";
import { createSettingsLogEvent, createSettingsMetric } from "../settings-observability";

describe("settings observability", () => {
  it("creates typed metrics", () => {
    expect(
      createSettingsMetric({
        cardId: "card-a",
        name: "settings_cache_hit",
        tenantId: "tenant-a",
        unit: "count",
        value: 1
      })
    ).toMatchObject({ name: "settings_cache_hit", tenantId: "tenant-a", value: 1 });
  });

  it("sanitizes sensitive metadata keys from log events", () => {
    const event = createSettingsLogEvent({
      event: "settings_api_request",
      level: "info",
      message: "Settings request handled.",
      metadata: {
        password: "hidden",
        route: "/api/settings"
      }
    });

    expect(event.metadata).toEqual({ route: "/api/settings" });
  });
});
