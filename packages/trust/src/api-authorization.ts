export const trustPermissions = ["trust.verify", "trust.keys.read", "trust.keys.manage", "trust.provenance.read", "trust.audit.verify", "trust.merkle.verify", "trust.revocations.read"] as const;
export type TrustPermission = (typeof trustPermissions)[number];
export type TrustOperation = "artifact-verification" | "trust-status" | "public-keys" | "provenance" | "audit-chains" | "merkle" | "key-status" | "key-rotation" | "revocations";

export const trustOperationPermissions: Readonly<Record<TrustOperation, TrustPermission>> = {
  "artifact-verification": "trust.verify", "trust-status": "trust.verify", "public-keys": "trust.keys.read",
  provenance: "trust.provenance.read", "audit-chains": "trust.audit.verify", merkle: "trust.merkle.verify",
  "key-status": "trust.keys.read", "key-rotation": "trust.keys.manage", revocations: "trust.revocations.read"
};

export function isTrustOperation(value: string): value is TrustOperation { return value in trustOperationPermissions; }
export function authorizeTrustOperation(input: { readonly operation: string; readonly permissions: readonly string[]; readonly authenticatedTenantId: string; readonly resourceTenantId: string; readonly cardId: string | null; readonly permittedCardIds: readonly string[]; readonly privileged: boolean }): { readonly allowed: true; readonly permission: TrustPermission } | { readonly allowed: false; readonly code: "unknown_operation" | "tenant_mismatch" | "card_access_denied" | "permission_denied" } {
  if (!isTrustOperation(input.operation)) return { allowed: false, code: "unknown_operation" };
  if (input.authenticatedTenantId !== input.resourceTenantId) return { allowed: false, code: "tenant_mismatch" };
  if (!input.privileged && (input.cardId === null || !input.permittedCardIds.includes(input.cardId))) return { allowed: false, code: "card_access_denied" };
  const permission = trustOperationPermissions[input.operation];
  if (!input.permissions.includes(permission)) return { allowed: false, code: "permission_denied" };
  return { allowed: true, permission };
}
