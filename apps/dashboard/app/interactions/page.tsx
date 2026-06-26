import { Card, CardContent, CardDescription, CardHeader, CardTitle, Grid } from "@bidayax/ui";
import { ConversionSummary } from "@/components/ConversionSummary";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { EventTypeBreakdown } from "@/components/EventTypeBreakdown";
import { ExecutiveBreakdown } from "@/components/ExecutiveBreakdown";
import { IntentTierBreakdown } from "@/components/IntentTierBreakdown";
import { MetricCard } from "@/components/MetricCard";
import { PrioritySignals } from "@/components/PrioritySignals";
import { RecentInteractionFeed } from "@/components/RecentInteractionFeed";
import { getDashboardData } from "@/data/dashboard-queries";
import { getIntentDashboardData } from "@/data/intent-queries";
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
  const [data, intentData] = await Promise.all([
    getDashboardData(),
    getIntentDashboardData()
  ]);
  const shouldShowEmptyState = data.status !== "ready" || data.totalInteractions === 0;

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
      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityTrend rows={data.dailyCounts} />
        <RecentInteractionFeed interactions={data.recentInteractions} />
      </div>
    </DashboardShell>
  );
}
