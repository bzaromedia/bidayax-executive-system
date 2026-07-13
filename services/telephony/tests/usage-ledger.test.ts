import { describe, expect, it } from "vitest";
import { createUsageLedgerEntry, estimateTelephonyCostCents } from "../src/usage-ledger";

describe("usage ledger", () => {
  it("creates zero-cost future ledger entries until providers are configured", () => {
    const entry = createUsageLedgerEntry({
      cardId: "card-1",
      category: "future_transcription",
      ledgerEntryId: "ledger-1",
      metadata: {},
      occurredAt: "2026-07-13T00:00:00.000Z",
      quantity: 10,
      sessionId: "session-1",
      tenantId: "tenant-1",
      unit: "minute"
    });

    expect(entry.estimatedCostCents).toBe(0);
  });

  it("rejects negative usage", () => {
    expect(() =>
      estimateTelephonyCostCents({ category: "provider_minutes", quantity: -1 })
    ).toThrow("Telephony usage quantity cannot be negative.");
  });
});
