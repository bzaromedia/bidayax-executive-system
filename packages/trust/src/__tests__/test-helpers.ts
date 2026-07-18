import { generateKeyPairSync, sign as nodeSign, type KeyObject } from "node:crypto";
import type { SignatureProvider } from "../providers";
import type { KeyPurpose, TrustKey, TrustKeyStatus } from "../types";
import type { TrustKeyResolver } from "../keys";

export const signedAt = "2026-07-17T10:00:00.000Z";
export const verifiedAt = "2026-07-17T11:00:00.000Z";

export function keyFixture(purpose: KeyPurpose = "settings_signing", status: TrustKeyStatus = "active") {
  const pair = generateKeyPairSync("ed25519");
  const key: TrustKey = {
    algorithm: "Ed25519", compromisedAt: status === "compromised" ? signedAt : null,
    createdAt: "2026-07-01T00:00:00.000Z", identityId: "identity-1", keyId: `key-${purpose}`,
    keyVersion: 1, metadata: {}, providerKeyReference: `test-ref-${purpose}`, providerType: "remote-signer",
    publicKey: pair.publicKey.export({ format: "der", type: "spki" }).toString("base64url"),
    publicKeyEncoding: "spki-der-base64url", purpose, replacesKeyId: null, replacesKeyVersion: null,
    revokedAt: status === "revoked" ? signedAt : null, scopeId: "tenant-1", status,
    statusChangedAt: "2026-07-01T00:00:00.000Z", structureVersion: "1", tenantId: "tenant-1",
    validFrom: "2026-07-01T00:00:00.000Z", validUntil: null
  };
  return { key, pair, provider: ephemeralProvider(new Map([[key.providerKeyReference, pair.privateKey]])) };
}

export function ephemeralProvider(keys: ReadonlyMap<string, KeyObject>): SignatureProvider {
  return { async sign(input) {
    const key = keys.get(input.key.providerKeyReference);
    if (!key) throw new Error("Missing ephemeral test key");
    return nodeSign(null, input.data, key);
  } };
}

export function keyResolver(key: TrustKey | null): TrustKeyResolver {
  return { async resolve() { return key; } };
}
