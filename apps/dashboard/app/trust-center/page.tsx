import { DashboardShell } from "@/components/DashboardShell";
import { TrustCenter } from "@/components/TrustCenter";
export const dynamic = "force-dynamic";
type TrustCenterPageProps = { readonly searchParams?: Promise<{ readonly cardId?: string }> };
export default async function TrustCenterPage({ searchParams }: TrustCenterPageProps) {
  const params = await searchParams;
  const selectedCardId = typeof params?.cardId === "string" && params.cardId.trim() ? params.cardId.trim() : null;
  return <DashboardShell description="Read-only cryptographic verification, key, provenance, and audit-chain posture." generatedAt={new Date().toISOString()} status="ready" title="Trust Center"><TrustCenter selectedCardId={selectedCardId} /></DashboardShell>;
}
