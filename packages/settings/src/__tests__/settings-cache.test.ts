import { describe, expect, it } from "vitest";
import {
  createSettingsCache,
  createSettingsCacheEntry,
  makeSettingsCacheKey
} from "../settings-cache";

describe("settings cache", () => {
  it("uses tenant-scoped cache keys", () => {
    expect(
      makeSettingsCacheKey({
        cardId: "card-a",
        kind: "published-card",
        tenantId: "tenant-a"
      })
    ).toBe("tenant-a:card-a:published-card:current");
  });

  it("invalidates only the requested card", () => {
    const cache = createSettingsCache();
    const cardA = makeSettingsCacheKey({ cardId: "card-a", kind: "published-card", tenantId: "tenant-a" });
    const cardB = makeSettingsCacheKey({ cardId: "card-b", kind: "published-card", tenantId: "tenant-a" });

    cache.set(createSettingsCacheEntry({ key: cardA, tenantId: "tenant-a", ttlMs: 1000, value: "a" }));
    cache.set(createSettingsCacheEntry({ key: cardB, tenantId: "tenant-a", ttlMs: 1000, value: "b" }));

    expect(cache.invalidateCard("tenant-a", "card-a")).toBe(1);
    expect(cache.get<string>(cardA)).toBeNull();
    expect(cache.get<string>(cardB)).toBe("b");
  });
});
