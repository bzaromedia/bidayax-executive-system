import { DashboardShell } from "@/components/DashboardShell";
import { TrustCenter } from "@/components/TrustCenter";
export const dynamic = "force-dynamic";
export default function TrustCenterPage() {
  return <DashboardShell description="Read-only cryptographic verification, key, provenance, and audit-chain posture." generatedAt={new Date().toISOString()} status="ready" title="Trust Center"><TrustCenter /></DashboardShell>;
}
