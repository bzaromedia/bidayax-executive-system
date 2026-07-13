import { Buffer } from "node:buffer";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} from "node:crypto";

export function randomUrlToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function hmacSha256(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createPkcePair(): { readonly challenge: string; readonly verifier: string } {
  const verifier = randomUrlToken(48);
  return { challenge: sha256Base64Url(verifier), verifier };
}

const sensitiveKeyPattern =
  /(authorization|cookie|credential|password|secret|token|code|verifier|raw|payload)/i;

export function sanitizeIdentityMetadata(
  metadata: Readonly<Record<string, unknown>>
): Readonly<Record<string, string | number | boolean | null>> {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !sensitiveKeyPattern.test(key))
      .filter(([, value]) =>
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      )
  ) as Readonly<Record<string, string | number | boolean | null>>;
}

export function deterministicIdentityId(...parts: readonly string[]): string {
  return sha256(parts.join("|"));
}

function encryptionKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function sealSecret(value: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function unsealSecret(value: string, secret: string): string {
  const parts = value.split(".");
  if (parts.length !== 3) throw new Error("Encrypted identity value is malformed.");
  const [ivPart, tagPart, ciphertextPart] = parts;
  if (!ivPart || !tagPart || !ciphertextPart) {
    throw new Error("Encrypted identity value is incomplete.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(secret),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
