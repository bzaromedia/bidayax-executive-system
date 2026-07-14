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

    expect(entry).toMatchObject({
      amountCents: 0,
      correlationId: "ledger-1",
      currency: "USD",
      estimatedCostCents: 0,
      source: "control_plane",
      unitCostCents: 0
    });
  });

  it("rejects negative usage", () => {
    expect(() =>
      estimateTelephonyCostCents({ category: "provider_minutes", quantity: -1 })
    ).toThrow("Telephony usage quantity cannot be negative.");
  });

  it("requires reversal evidence for negative ledger adjustments", () => {
    expect(() =>
      createUsageLedgerEntry({
        amountCents: -100,
        cardId: "card-1",
        category: "adjustment",
        ledgerEntryId: "ledger-negative",
        metadata: {},
        occurredAt: "2026-07-13T00:00:00.000Z",
        quantity: 0,
        sessionId: "session-1",
        tenantId: "tenant-1",
        unit: "usd"
      })
    ).toThrow("Negative telephony ledger entries require a reversal reference.");
  });
});
