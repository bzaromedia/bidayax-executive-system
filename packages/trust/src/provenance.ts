import { canonicalUtcTimestamp } from "./canonicalization";
import { createDomainDigest } from "./domains";
import { isHexDigest } from "./hashing";
import { provenanceLifecycleEvents, type ProvenanceEvent, type ProvenanceLink, type ProvenanceLifecycleEvent, type ProvenanceManifest, type SafeMetadata } from "./types";
import { assertSafeMetadata } from "./validation";

function safeReference(value: string | null): boolean { return value === null || /^(ref|urn):[A-Za-z0-9._:/-]+$/.test(value); }
function linkIdentity(link: ProvenanceLink): string { return `${link.artifactType}\u0000${link.artifactId}\u0000${link.artifactVersion}\u0000${link.relationship}`; }

export function createProvenanceEvent(input: { readonly eventId: string; readonly lifecycle: ProvenanceLifecycleEvent; readonly occurredAt: string; readonly actorIdentityId: string | null; readonly priorDigest: string | null; readonly resultingDigest: string | null; readonly safeReference: string | null; readonly metadata: SafeMetadata }): ProvenanceEvent {
  if (!(provenanceLifecycleEvents as readonly string[]).includes(input.lifecycle)) throw new Error("Unknown provenance lifecycle event");
  if ((input.priorDigest !== null && !isHexDigest(input.priorDigest)) || (input.resultingDigest !== null && !isHexDigest(input.resultingDigest))) throw new Error("Provenance events store digests only");
  if (!safeReference(input.safeReference)) throw new Error("Unsafe provenance reference");
  assertSafeMetadata(input.metadata);
  return Object.freeze({ ...input, occurredAt: canonicalUtcTimestamp(input.occurredAt) });
}

function manifestPayload(input: Omit<ProvenanceManifest, "manifestId" | "manifestDigest">): Record<string, unknown> { return input; }

export function createProvenanceManifest(input: {
  readonly tenantId: string; readonly artifactType: string; readonly artifactId: string; readonly artifactVersion: string;
  readonly artifactDigest: string; readonly links: readonly ProvenanceLink[]; readonly events: readonly ProvenanceEvent[];
  readonly createdAt: string; readonly schemaVersion: string; readonly metadata: SafeMetadata;
}): ProvenanceManifest {
  if (!isHexDigest(input.artifactDigest)) throw new Error("Invalid artifact digest");
  assertSafeMetadata(input.metadata);
  const links = [...input.links].sort((a, b) => linkIdentity(a) < linkIdentity(b) ? -1 : linkIdentity(a) > linkIdentity(b) ? 1 : 0);
  const seen = new Set<string>();
  for (const link of links) {
    if (!isHexDigest(link.digest)) throw new Error("Invalid provenance link digest");
    const identity = linkIdentity(link);
    if (seen.has(identity)) throw new Error("Duplicate provenance link");
    seen.add(identity);
  }
  const events = [...input.events].sort((a, b) => {
    const left = `${a.occurredAt}\u0000${a.eventId}`;
    const right = `${b.occurredAt}\u0000${b.eventId}`;
    return left < right ? -1 : left > right ? 1 : 0;
  });
  if (new Set(events.map((event) => event.eventId)).size !== events.length) throw new Error("Duplicate provenance event");
  for (let index = 1; index < events.length; index += 1) {
    if (events[index]?.priorDigest !== events[index - 1]?.resultingDigest) throw new Error("Broken provenance event digest linkage");
  }
  const base = {
    artifactDigest: input.artifactDigest, artifactId: input.artifactId, artifactType: input.artifactType,
    artifactVersion: input.artifactVersion, createdAt: canonicalUtcTimestamp(input.createdAt), events: Object.freeze(events),
    links: Object.freeze(links), metadata: input.metadata, schemaVersion: input.schemaVersion, structureVersion: "1" as const, tenantId: input.tenantId
  };
  const manifestDigest = createDomainDigest({ artifactId: input.artifactId, artifactType: input.artifactType, artifactVersion: input.artifactVersion, cardId: null, domain: "provenance.manifest", payload: manifestPayload(base as Omit<ProvenanceManifest, "manifestId" | "manifestDigest">) as never, schemaVersion: input.schemaVersion, tenantId: input.tenantId });
  return Object.freeze({ ...base, manifestDigest, manifestId: `prov_${manifestDigest}` });
}

export function verifyProvenanceManifest(manifest: ProvenanceManifest): boolean {
  try {
    const recreated = createProvenanceManifest(manifest);
    return recreated.manifestId === manifest.manifestId && recreated.manifestDigest === manifest.manifestDigest && recreated.links.every((link, index) => linkIdentity(link) === linkIdentity(manifest.links[index] as ProvenanceLink)) && recreated.events.every((event, index) => event.eventId === manifest.events[index]?.eventId);
  } catch { return false; }
}

export function provenanceLinksArtifact(manifest: ProvenanceManifest, input: { readonly artifactType: string; readonly artifactId: string; readonly artifactVersion: string; readonly digest: string }): boolean {
  return verifyProvenanceManifest(manifest) && manifest.links.some((link) => link.artifactType === input.artifactType && link.artifactId === input.artifactId && link.artifactVersion === input.artifactVersion && link.digest === input.digest);
}
