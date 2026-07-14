import { DashboardShell } from "@/components/DashboardShell";
import { TelephonyControlPlaneSummary } from "@/components/TelephonyControlPlaneSummary";
import { TelephonyReadinessSummary } from "@/components/TelephonyReadinessSummary";
import { getTelephonyDashboardData } from "@/data/telephony-queries";

export const dynamic = "force-dynamic";

export default async function TelephonyPage() {
  const data = await getTelephonyDashboardData();
  const generatedAt = new Date().toISOString();

  return (
    <DashboardShell
      description="Provider-independent Telephony Control Plane status. This page does not enable live calls or configure a provider."
      generatedAt={generatedAt}
      status={data.status}
      title="Telephony Domain Foundation"
    >      <TelephonyControlPlaneSummary />
      <TelephonyReadinessSummary summary={data.summary} />
    </DashboardShell>
  );
}

