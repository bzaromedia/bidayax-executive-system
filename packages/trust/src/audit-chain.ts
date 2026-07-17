import { canonicalUtcTimestamp } from "./canonicalization";
import { internalDigest } from "./hashing";
import type { AuditChainEntry, AuditCheckpoint, TrustEvent } from "./types";
import { validateTrustEvent } from "./validation";

export const auditChainReasonCodes = ["valid", "chain_gap", "chain_fork", "event_replay", "event_digest_mismatch", "entry_digest_mismatch", "tenant_mismatch", "stream_mismatch", "invalid_genesis", "invalid_checkpoint", "non_deterministic_order"] as const;
export type AuditChainReasonCode = (typeof auditChainReasonCodes)[number];
export type AuditChainVerification = { readonly valid: boolean; readonly reasonCodes: readonly AuditChainReasonCode[]; readonly lastEntryId: string | null; readonly verifiedFromCheckpoint: boolean };

function eventDigest(event: TrustEvent): string { return internalDigest("trust-audit-event/v1", "trust-event-1", event); }
function entryDigest(entry: Omit<AuditChainEntry, "entryId" | "entryDigest">): string { return internalDigest("trust-audit-entry/v1", "trust-audit-entry-1", entry); }

export function appendAuditChainEntry(input: { readonly appendedAt: string; readonly chain: readonly AuditChainEntry[]; readonly streamId: string; readonly event: TrustEvent; readonly tenantId: string; readonly startingCheckpoint?: AuditCheckpoint }): AuditChainEntry {
  const verification = verifyAuditChain(input.chain, input.startingCheckpoint === undefined
    ? { expectedStreamId: input.streamId, expectedTenantId: input.tenantId }
    : { expectedStreamId: input.streamId, expectedTenantId: input.tenantId, trustedCheckpoint: input.startingCheckpoint });
  if (!verification.valid) throw new Error(`Cannot append to invalid chain: ${verification.reasonCodes.join(",")}`);
  if (!validateTrustEvent(input.event).valid || input.event.tenantId !== input.tenantId || input.event.streamId !== input.streamId) throw new Error("Invalid or cross-tenant audit event");
  if (input.chain.some((entry) => entry.event.eventId === input.event.eventId)) throw new Error("Audit replay");
  const previous = input.chain.at(-1) ?? null;
  const checkpoint = previous === null ? input.startingCheckpoint ?? null : null;
  const sequence = (previous?.sequence ?? checkpoint?.trustedSequence ?? 0) + 1;
  const base = {
    appendedAt: canonicalUtcTimestamp(input.appendedAt), checkpoint,
    event: input.event, eventDigest: eventDigest(input.event),
    previousDigest: previous?.entryDigest ?? checkpoint?.trustedDigest ?? null,
    sequence, streamId: input.streamId, structureVersion: "1" as const, tenantId: input.tenantId
  };
  const digest = entryDigest(base);
  return Object.freeze({ ...base, entryDigest: digest, entryId: `audit_${digest}` });
}

export function verifyAuditChain(entries: readonly AuditChainEntry[], options: { readonly expectedTenantId?: string; readonly expectedStreamId?: string; readonly trustedCheckpoint?: AuditCheckpoint } = {}): AuditChainVerification {
  const reasons: AuditChainReasonCode[] = [];
  const sequences = new Map<number, string>();
  const previousDigests = new Map<string, string>();
  const events = new Set<string>();
  const idempotencyKeys = new Set<string>();
  let previous: AuditChainEntry | null = null;
  for (const entry of entries) {
    if (options.expectedTenantId !== undefined && entry.tenantId !== options.expectedTenantId) reasons.push("tenant_mismatch");
    if (options.expectedStreamId !== undefined && entry.streamId !== options.expectedStreamId) reasons.push("stream_mismatch");
    if (previous && entry.sequence <= previous.sequence) reasons.push("non_deterministic_order");
    const existingSequence = sequences.get(entry.sequence);
    if (existingSequence !== undefined && existingSequence !== entry.entryDigest) reasons.push("chain_fork");
    sequences.set(entry.sequence, entry.entryDigest);
    if (entry.previousDigest !== null) {
      const child = previousDigests.get(entry.previousDigest);
      if (child !== undefined && child !== entry.entryDigest) reasons.push("chain_fork");
      previousDigests.set(entry.previousDigest, entry.entryDigest);
    }
    if (events.has(entry.event.eventId) || idempotencyKeys.has(entry.event.idempotencyKey) || [...entries].filter((candidate) => candidate.eventDigest === entry.eventDigest).length > 1) reasons.push("event_replay");
    events.add(entry.event.eventId);
    idempotencyKeys.add(entry.event.idempotencyKey);
    if (previous === null) {
      if (options.trustedCheckpoint) {
        if (entry.checkpoint?.trustedSequence !== options.trustedCheckpoint.trustedSequence || entry.checkpoint.trustedDigest !== options.trustedCheckpoint.trustedDigest || entry.sequence !== options.trustedCheckpoint.trustedSequence + 1 || entry.previousDigest !== options.trustedCheckpoint.trustedDigest) reasons.push("invalid_checkpoint");
      } else if (entry.sequence !== 1 || entry.previousDigest !== null || entry.checkpoint !== null) reasons.push("invalid_genesis");
    } else if (entry.sequence !== previous.sequence + 1 || entry.previousDigest !== previous.entryDigest) reasons.push("chain_gap");
    if (previous && entry.tenantId !== previous.tenantId) reasons.push("tenant_mismatch");
    if (previous && entry.streamId !== previous.streamId) reasons.push("stream_mismatch");
    if (entry.event.tenantId !== entry.tenantId) reasons.push("tenant_mismatch");
    if (entry.event.streamId !== entry.streamId) reasons.push("stream_mismatch");
    if (eventDigest(entry.event) !== entry.eventDigest) reasons.push("event_digest_mismatch");
    const expected = entryDigest({ appendedAt: entry.appendedAt, checkpoint: entry.checkpoint, event: entry.event, eventDigest: entry.eventDigest, previousDigest: entry.previousDigest, sequence: entry.sequence, streamId: entry.streamId, structureVersion: entry.structureVersion, tenantId: entry.tenantId });
    if (expected !== entry.entryDigest || entry.entryId !== `audit_${expected}`) reasons.push("entry_digest_mismatch");
    previous = entry;
  }
  const unique = [...new Set(reasons)];
  return { lastEntryId: entries.at(-1)?.entryId ?? null, reasonCodes: unique.length === 0 ? ["valid"] : unique, valid: unique.length === 0, verifiedFromCheckpoint: options.trustedCheckpoint !== undefined };
}
