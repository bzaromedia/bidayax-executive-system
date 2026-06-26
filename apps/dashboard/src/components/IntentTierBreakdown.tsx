import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type {
  DashboardExecutiveIntentSummary,
  DashboardIntentTierBreakdown
} from "../types/dashboard";
import { formatInteger, formatPercent } from "../lib/formatters";
import { formatScore } from "../lib/intent-formatters";

type IntentTierBreakdownProps = {
  readonly rows: readonly DashboardIntentTierBreakdown[];
  readonly executiveSummary: readonly DashboardExecutiveIntentSummary[];
};

export function IntentTierBreakdown({
  executiveSummary,
  rows
}: IntentTierBreakdownProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <Badge variant="neutral">Tiers</Badge>
          <CardTitle>Intent tier breakdown</CardTitle>
          <CardDescription>Anonymous signals grouped by deterministic tier.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.tier} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-heading text-sm font-semibold text-content-primary">
                    {row.tier}
                  </p>
                  <p className="text-sm text-content-secondary">
                    {formatInteger(row.count)} / {formatPercent(row.share)}
                  </p>
                </div>
                <div
                  aria-label={`${row.tier} ${formatPercent(row.share)}`}
                  className="h-2 overflow-hidden rounded-bxSm bg-surface-inset"
                  role="img"
                >
                  <div
                    className="h-full rounded-bxSm bg-content-accent"
                    style={{ width: `${Math.max(row.share * 100, row.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Badge variant="accent">Executives</Badge>
          <CardTitle>Executive-level intent summary</CardTitle>
          <CardDescription>Score summaries by executive card.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {executiveSummary.map((row) => (
              <div
                key={row.executiveSlug}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading text-sm font-semibold text-content-primary">
                      {row.executiveName}
                    </p>
                    <p className="mt-1 text-xs text-content-muted">
                      {formatInteger(row.signalCount)} anonymous signals
                    </p>
                  </div>
                  <p className="text-sm text-content-secondary">
                    Max {formatScore(row.maxScore)}
                  </p>
                </div>
                <p className="mt-3 text-sm text-content-muted">
                  Average score {formatScore(row.averageScore)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
