"use client";
import { useEffect, useState } from "react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import { deriveTrustCenterState, resolveTrustCenterRequestScope, trustCenterReadinessLabel, trustCenterStateLabel, type TrustCenterSessionScope, type TrustCenterSnapshot, type TrustCenterState } from "@/lib/trust-center-state";

export type TrustCenterProps = { readonly selectedCardId?: string | null };

export function TrustCenter({ selectedCardId = null }: TrustCenterProps) {
  const [snapshot, setSnapshot] = useState<TrustCenterSnapshot | null>(null);
  const [state, setState] = useState<TrustCenterState>("loading");
  const [emptyReason, setEmptyReason] = useState<"card_required" | "unauthenticated" | null>(null);
  useEffect(() => {
    let cancelled = false;
    setSnapshot(null);
    setState("loading");
    setEmptyReason(null);
    globalThis.fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" }).then(async (sessionResponse) => {
      if (!sessionResponse.ok) return { authenticated: false } satisfies TrustCenterSessionScope;
      return await sessionResponse.json() as TrustCenterSessionScope;
    }).then((session) => {
      if (cancelled) return null;
      const scope = resolveTrustCenterRequestScope(session, selectedCardId);
      if (!scope.request) { setState("unavailable"); setEmptyReason(scope.reason ?? null); return null; }
      return globalThis.fetch("/api/internal/trust/trust-status?" + scope.params.toString(), { cache: "no-store", credentials: "same-origin" });
    }).then(async (response) => {
      if (cancelled || response === null) return;
      if (!response.ok) { setState(deriveTrustCenterState({ errorStatus: response.status, now: new Date().toISOString() })); return; }
      const body = await response.json() as { data: Array<{ signed_settings: number; active_keys: number; revoked_keys: number; compromised_keys: number; verification_failures: number; audit_available: boolean; provenance_available: boolean; production_provider: boolean; test_key: boolean; latest_rotation_at: string | null }> };
      const row = body.data[0];
      const value: TrustCenterSnapshot = { activeKeys: row?.active_keys ?? 0, algorithmPolicyVersion: "trust-algorithm-policy-1", auditChainValid: row?.audit_available ?? false, compromisedKeys: row?.compromised_keys ?? 0, generatedAt: new Date().toISOString(), latestRotationAt: row?.latest_rotation_at ?? null, provenanceAvailable: row?.provenance_available ?? false, providerStatus: row?.test_key ? "test" : row?.production_provider ? "production" : "unavailable", revokedKeys: row?.revoked_keys ?? 0, signedSettings: row?.signed_settings ?? 0, verificationFailures: row?.verification_failures ?? 0 };
      setSnapshot(value);
      setState(deriveTrustCenterState({ now: new Date().toISOString(), snapshot: value }));
    }).catch(() => { if (!cancelled) setState("unavailable"); });
    return () => { cancelled = true; };
  }, [selectedCardId]);
  const rows = snapshot ? [["Algorithm policy", snapshot.algorithmPolicyVersion], ["Active public keys", String(snapshot.activeKeys)], ["Active key purpose", snapshot.activeKeys ? "Available through key metadata" : "None"], ["Latest rotation", snapshot.latestRotationAt ?? "No rotation recorded"], ["Revoked keys", String(snapshot.revokedKeys)], ["Signed settings", String(snapshot.signedSettings)], ["Audit chain", snapshot.auditChainValid ? "Healthy" : "Verification failed"], ["Provenance", snapshot.provenanceAvailable ? "Available" : "No signed artifacts"], ["Verification failures", String(snapshot.verificationFailures)], ["Production key provider", snapshot.providerStatus], ["Test-key warning", snapshot.providerStatus === "test" ? "Test key detected" : "None"], ["Production readiness", trustCenterReadinessLabel[state]]] : [];
  const emptyMessage = emptyReason === "card_required" ? "Select an authorized card to view card-scoped trust evidence." : "Trust evidence is unavailable or authorization is required.";
  return <Card aria-live="polite"><CardHeader><Badge variant={state === "operational" ? "accent" : "neutral"}>{trustCenterStateLabel[state]}</Badge><CardTitle>Cryptographic Trust Center</CardTitle><CardDescription>Read-only authenticated tenant-scoped verification evidence. Public metadata only; secret and private-key material is never displayed.</CardDescription></CardHeader><CardContent>{state === "loading" ? <p>Loading cryptographic trust status…</p> : state === "unavailable" && !snapshot ? <p>{emptyMessage}</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map(([label,value]) => <div key={label} className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"><p className="text-xs uppercase tracking-wide text-content-muted">{label}</p><p className="mt-2 text-sm font-semibold text-content-primary">{value}</p></div>)}</div>}</CardContent></Card>;
}
