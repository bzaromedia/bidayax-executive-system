import type {
  AeadAlgorithm,
  DigestAlgorithm,
  KdfAlgorithm,
  MacAlgorithm,
  PasswordHashAlgorithm,
  PostQuantumAlgorithmHook,
  SignatureAlgorithm
} from "./policy";

export type ProviderKeyHandle = {
  readonly providerType: "kms" | "hsm" | "remote-signer";
  readonly providerKeyReference: string;
  readonly keyId: string;
  readonly keyVersion: number;
};

export type DigestProvider = {
  readonly digest: (input: { readonly algorithm: DigestAlgorithm; readonly data: Uint8Array }) => Promise<Uint8Array>;
};

/** Provider receives an opaque key reference; private key bytes are never part of this interface. */
export type SignatureProvider = {
  readonly sign: (input: { readonly algorithm: SignatureAlgorithm; readonly data: Uint8Array; readonly key: ProviderKeyHandle }) => Promise<Uint8Array>;
};

export type SignatureVerificationProvider = {
  readonly verify: (input: { readonly algorithm: SignatureAlgorithm; readonly data: Uint8Array; readonly publicKey: Uint8Array; readonly signature: Uint8Array }) => Promise<boolean>;
};

/** AEAD providers own nonce generation and uniqueness enforcement; callers cannot supply a nonce. */
export type AeadProvider = {
  readonly encrypt: (input: { readonly algorithm: AeadAlgorithm; readonly keyReference: string; readonly plaintext: Uint8Array; readonly associatedData: Uint8Array }) => Promise<{ readonly ciphertext: Uint8Array; readonly nonce: Uint8Array; readonly tag: Uint8Array }>;
  readonly decrypt: (input: { readonly algorithm: AeadAlgorithm; readonly keyReference: string; readonly ciphertext: Uint8Array; readonly nonce: Uint8Array; readonly tag: Uint8Array; readonly associatedData: Uint8Array }) => Promise<Uint8Array>;
};

export type KdfProvider = { readonly derive: (input: { readonly algorithm: KdfAlgorithm; readonly keyReference: string; readonly salt: Uint8Array; readonly info: Uint8Array; readonly length: number }) => Promise<Uint8Array> };
export type MacProvider = { readonly authenticate: (input: { readonly algorithm: MacAlgorithm; readonly keyReference: string; readonly data: Uint8Array }) => Promise<Uint8Array> };
export type PasswordHashProvider = { readonly hash: (input: { readonly algorithm: PasswordHashAlgorithm; readonly password: string }) => Promise<string>; readonly verify: (input: { readonly algorithm: PasswordHashAlgorithm; readonly password: string; readonly encodedHash: string }) => Promise<boolean> };

export type PostQuantumProviderHook<T extends PostQuantumAlgorithmHook> = {
  readonly algorithm: T;
  readonly implementationAvailable: false;
};

export type FutureHardwareProvider = {
  readonly providerType: "kms" | "hsm";
  readonly registerPublicKey: (input: { readonly tenantId: string; readonly purpose: string; readonly algorithm: SignatureAlgorithm; readonly providerKeyReference: string }) => Promise<{ readonly publicKey: Uint8Array }>;
};
