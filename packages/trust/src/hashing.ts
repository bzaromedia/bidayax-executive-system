import { createHash } from "node:crypto";
import { canonicalize, CANONICALIZATION_VERSION } from "./canonicalization";
import { ALGORITHM_POLICY_VERSION, enforceAlgorithmPolicy } from "./policy";
import type { HexDigest } from "./types";

export function sha256Bytes(value: Uint8Array): HexDigest {
  return createHash("sha256").update(value).digest("hex");
}

/** Internal domain separation for trust infrastructure, not a substitute for SecurityDomain. */
export function internalDigest(context: string, schemaVersion: string, value: unknown): HexDigest {
  enforceAlgorithmPolicy({ algorithm: "SHA-256", context: "artifact-digest", operation: "digest", policyVersion: ALGORITHM_POLICY_VERSION });
  const canonical = canonicalize({
    algorithmPolicyVersion: ALGORITHM_POLICY_VERSION,
    canonicalizationVersion: CANONICALIZATION_VERSION,
    context,
    schemaVersion,
    value
  }, { schemaVersion: "trust-internal-digest-1" });
  return sha256Bytes(canonical.bytes);
}

export function isHexDigest(value: unknown): value is HexDigest {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}
