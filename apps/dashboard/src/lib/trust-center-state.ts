export type TrustCenterState = "loading" | "operational" | "degraded" | "unavailable" | "verification_failed" | "revoked_key" | "test_key_warning" | "no_production_provider" | "no_signed_artifacts";
export type TrustCenterSnapshot = { readonly algorithmPolicyVersion: string; readonly activeKeys: number; readonly revokedKeys: number; readonly compromisedKeys: number; readonly signedSettings: number; readonly auditChainValid: boolean; readonly provenanceAvailable: boolean; readonly verificationFailures: number; readonly providerStatus: "production" | "test" | "unavailable"; readonly latestRotationAt: string | null; readonly generatedAt: string };
export type TrustCenterSessionScope = { readonly authenticated: boolean; readonly session?: { readonly role: string; readonly tenantId: string } };
export type TrustCenterRequestScope = { readonly reason?: "unauthenticated" | "card_required"; readonly request: false } | { readonly params: URLSearchParams; readonly request: true };
export function deriveTrustCenterState(input: { readonly loading?: boolean; readonly errorStatus?: number | null; readonly now: string; readonly snapshot?: TrustCenterSnapshot | null }): TrustCenterState {
  if (input.loading) return "loading";
  if (input.errorStatus !== undefined && input.errorStatus !== null) return "unavailable";
  const value = input.snapshot;
  if (!value) return "unavailable";
  if (value.verificationFailures > 0) return "verification_failed";
  if (value.revokedKeys > 0 || value.compromisedKeys > 0) return "revoked_key";
  if (value.providerStatus === "test") return "test_key_warning";
  if (value.providerStatus !== "production") return "no_production_provider";
  if (value.signedSettings === 0) return "no_signed_artifacts";
  if (Date.parse(input.now) - Date.parse(value.generatedAt) > 5 * 60_000 || !value.auditChainValid || !value.provenanceAvailable) return "degraded";
  return "operational";
}
export const trustCenterStateLabel: Readonly<Record<TrustCenterState, string>> = { loading: "Loading", operational: "Operational", degraded: "Degraded", unavailable: "Unavailable", verification_failed: "Verification failed", revoked_key: "Revoked key", test_key_warning: "Test-key warning", no_production_provider: "No production provider", no_signed_artifacts: "No signed artifacts" };
export const trustCenterReadinessLabel: Readonly<Record<TrustCenterState, string>> = { loading: "Checking", operational: "Ready", degraded: "Review warnings", unavailable: "Unavailable", verification_failed: "Verification failed", revoked_key: "Revoked or compromised key", test_key_warning: "Test configuration", no_production_provider: "Configuration required", no_signed_artifacts: "No signed artifacts" };
export function resolveTrustCenterRequestScope(session: TrustCenterSessionScope, selectedCardId: string | null): TrustCenterRequestScope {
  if (!session.authenticated || !session.session) return { reason: "unauthenticated", request: false };
  const privileged = session.session.role === "tenant_owner" || session.session.role === "tenant_admin";
  if (!privileged && !selectedCardId) return { reason: "card_required", request: false };
  const params = new URLSearchParams({ tenantId: session.session.tenantId });
  if (selectedCardId) params.set("cardId", selectedCardId);
  return { params, request: true };
}
