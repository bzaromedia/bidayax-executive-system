import { Card, CardContent, CardDescription, CardHeader, CardTitle, Grid } from "@bidayax/ui";
import { CallLifecycleFeed } from "@/components/CallLifecycleFeed";
import { ConversionSummary } from "@/components/ConversionSummary";
import { ContactGraphSummary } from "@/components/ContactGraphSummary";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { EngagementPathList } from "@/components/EngagementPathList";
import { EventTypeBreakdown } from "@/components/EventTypeBreakdown";
import { ExecutiveRelationshipSnapshot } from "@/components/ExecutiveRelationshipSnapshot";
import { ExecutiveBreakdown } from "@/components/ExecutiveBreakdown";
import { GraphEmptyState } from "@/components/GraphEmptyState";
import { IntentTierBreakdown } from "@/components/IntentTierBreakdown";
import { LiveProviderReadinessPanel } from "@/components/LiveProviderReadinessPanel";
import { MetricCard } from "@/components/MetricCard";
import { PrioritySignals } from "@/components/PrioritySignals";
import { ProductionCallWarning } from "@/components/ProductionCallWarning";
import { ProductionHardeningWarnings } from "@/components/ProductionHardeningWarnings";
import { ProviderConfigurationChecklist } from "@/components/ProviderConfigurationChecklist";
import { RecentInteractionFeed } from "@/components/RecentInteractionFeed";
import { ReceptionistEmptyState } from "@/components/ReceptionistEmptyState";
import { ReceptionistInteractionFeed } from "@/components/ReceptionistInteractionFeed";
import { ReceptionistLanguageBreakdown } from "@/components/ReceptionistLanguageBreakdown";
import { ReceptionistSummary } from "@/components/ReceptionistSummary";
import { ReceptionistTaskList } from "@/components/ReceptionistTaskList";
import { OutboundCallApprovalList } from "@/components/OutboundCallApprovalList";
import { TelephonyEmptyState } from "@/components/TelephonyEmptyState";
import { TelephonyReadinessSummary } from "@/components/TelephonyReadinessSummary";
import { TestCallModeStatus } from "@/components/TestCallModeStatus";
import { VoiceRuntimeSafetyPanel } from "@/components/VoiceRuntimeSafetyPanel";
import { VoiceSessionStatus } from "@/components/VoiceSessionStatus";
import { getDashboardData } from "@/data/dashboard-queries";
import { getGraphDashboardData } from "@/data/graph-queries";
import { getIntentDashboardData } from "@/data/intent-queries";
import { getLiveProviderDashboardData } from "@/data/live-provider-queries";
import { getReceptionistDashboardData } from "@/data/receptionist-queries";
import { getTelephonyDashboardData } from "@/data/telephony-queries";
import { formatInteger, formatShortDate } from "@/lib/formatters";

export const dynamic = "force-dynamic";

function ActivityTrend({
  rows
}: {
  readonly rows: readonly { readonly date: string; readonly count: number }[];
}) {
  const maxCount = Math.max(...rows.map((row) => row.count), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>14-day activity</CardTitle>
        <CardDescription>Daily ledger events from the last two weeks.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-content-muted">No recent daily activity.</p>
        ) : (
          <div className="flex h-48 items-end gap-2" role="list">
            {rows.map((row) => {
              const height = maxCount > 0 ? Math.max((row.count / maxCount) * 100, 5) : 0;

              return (
                <div key={row.date} className="flex min-w-0 flex-1 flex-col items-center gap-2" role="listitem">
                  <div
                    aria-label={`${formatShortDate(row.date)} ${formatInteger(row.count)} events`}
                    className="flex h-36 w-full items-end rounded-bxSm bg-surface-inset"
                    role="img"
                  >
                    <div
                      className="w-full rounded-bxSm bg-border-strong"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="truncate text-xs text-content-muted">
                    {formatShortDate(row.date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function InteractionsPage() {
  const [data, intentData, graphData, receptionistData, telephonyData, liveProviderData] =
    await Promise.all([
    getDashboardData(),
    getIntentDashboardData(),
    getGraphDashboardData(),
    getReceptionistDashboardData(),
    getTelephonyDashboardData(),
    getLiveProviderDashboardData()
  ]);
  const shouldShowEmptyState = data.status !== "ready" || data.totalInteractions === 0;
  const shouldShowGraphEmptyState =
    graphData.status !== "ready" || graphData.summary.nodeCount === 0;
  const shouldShowReceptionistEmptyState =
    receptionistData.status !== "ready" ||
    receptionistData.summary.interactionCount === 0;
  const shouldShowTelephonyEmptyState =
    telephonyData.status !== "ready" || telephonyData.summary.callCount === 0;

  return (
    <DashboardShell generatedAt={data.generatedAt} status={data.status}>
      {shouldShowEmptyState ? (
        <EmptyState message={data.statusMessage} status={data.status} />
      ) : null}
      <Grid columns={4} gap={4}>
        {data.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </Grid>
      <div className="grid gap-6 xl:grid-cols-2">
        <ExecutiveBreakdown rows={data.executiveBreakdown} />
        <EventTypeBreakdown rows={data.eventTypeBreakdown} />
      </div>
      <ConversionSummary rows={data.conversions} />
      <PrioritySignals
        signals={intentData.topIntentSignals}
        status={intentData.status}
        statusMessage={intentData.statusMessage}
      />
      <IntentTierBreakdown
        executiveSummary={intentData.executiveIntentSummary}
        rows={intentData.intentTierBreakdown}
      />
      {shouldShowGraphEmptyState ? (
        <GraphEmptyState
          status={graphData.status}
          statusMessage={graphData.statusMessage}
        />
      ) : (
        <>
          <ContactGraphSummary summary={graphData.summary} />
          <div className="grid gap-6 xl:grid-cols-2">
            <ExecutiveRelationshipSnapshot snapshots={graphData.snapshots} />
            <EngagementPathList paths={graphData.engagementPaths} />
          </div>
        </>
      )}
      {shouldShowReceptionistEmptyState ? (
        <ReceptionistEmptyState
          status={receptionistData.status}
          statusMessage={receptionistData.statusMessage}
        />
      ) : (
        <>
          <ReceptionistSummary summary={receptionistData.summary} />
          <ReceptionistLanguageBreakdown
            intents={receptionistData.intentBreakdown}
            languages={receptionistData.languageBreakdown}
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <ReceptionistInteractionFeed interactions={receptionistData.interactions} />
            <ReceptionistTaskList tasks={receptionistData.tasks} />
          </div>
        </>
      )}
      {shouldShowTelephonyEmptyState ? (
        <>
          <TelephonyReadinessSummary summary={telephonyData.summary} />
          <TelephonyEmptyState
            status={telephonyData.status}
            statusMessage={telephonyData.statusMessage}
          />
        </>
      ) : (
        <>
          <TelephonyReadinessSummary summary={telephonyData.summary} />
          <div className="grid gap-6 xl:grid-cols-2">
            <CallLifecycleFeed events={telephonyData.callEvents} />
            <VoiceSessionStatus sessions={telephonyData.voiceSessions} />
          </div>
          <OutboundCallApprovalList requests={telephonyData.outboundApprovals} />
        </>
      )}
      <LiveProviderReadinessPanel data={liveProviderData} />
      <ProductionHardeningWarnings
        databaseStatus={data.status}
        liveProviderData={liveProviderData}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <VoiceRuntimeSafetyPanel voiceRuntime={liveProviderData.voiceRuntime} />
        <TestCallModeStatus summary={liveProviderData.summary} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ProviderConfigurationChecklist summary={liveProviderData.summary} />
        <ProductionCallWarning summary={liveProviderData.summary} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityTrend rows={data.dailyCounts} />
        <RecentInteractionFeed interactions={data.recentInteractions} />
      </div>
    </DashboardShell>
  );
}
