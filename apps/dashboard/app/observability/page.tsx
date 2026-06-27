import { DashboardShell } from "@/components/DashboardShell";
import { ErrorEventPanel } from "@/components/ErrorEventPanel";
import { ObservabilityEmptyState } from "@/components/ObservabilityEmptyState";
import { ObservabilitySummary } from "@/components/ObservabilitySummary";
import { SafetyGateTelemetryPanel } from "@/components/SafetyGateTelemetryPanel";
import { SubsystemHealthMatrix } from "@/components/SubsystemHealthMatrix";
import { SystemMetricCards } from "@/components/SystemMetricCards";
import { TelemetryEventFeed } from "@/components/TelemetryEventFeed";
import { getObservabilityDashboardData } from "@/data/telemetry-queries";

export const dynamic = "force-dynamic";

export default async function ObservabilityPage() {
  const data = await getObservabilityDashboardData();
  const generatedAt = new Date().toISOString();
  const shouldShowEmptyState =
    data.status !== "ready" || data.summary.eventCount === 0;

  return (
    <DashboardShell generatedAt={generatedAt} status={data.status}>
      {shouldShowEmptyState ? (
        <ObservabilityEmptyState
          status={data.status}
          statusMessage={data.statusMessage}
        />
      ) : null}
      <ObservabilitySummary summary={data.summary} />
      <SystemMetricCards metrics={data.metrics} />
      <div className="grid gap-6 xl:grid-cols-2">
        <TelemetryEventFeed events={data.events} />
        <ErrorEventPanel errors={data.errors} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <SafetyGateTelemetryPanel events={data.safetyGateEvents} />
        <SubsystemHealthMatrix rows={data.subsystemHealth} />
      </div>
    </DashboardShell>
  );
}

