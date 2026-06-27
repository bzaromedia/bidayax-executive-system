import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardImprovementOpportunity } from "@bidayax/types";
import { formatShortDate } from "../lib/formatters";
import { formatImprovementLabel } from "../lib/improvement-formatters";

type OpportunityFeedProps = {
  readonly opportunities: readonly DashboardImprovementOpportunity[];
};

export function OpportunityFeed({ opportunities }: OpportunityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected opportunities</CardTitle>
        <CardDescription>Only telemetry-backed opportunities are listed.</CardDescription>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <p className="text-sm text-content-muted">No opportunities detected.</p>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-content-primary">
                    {formatImprovementLabel(opportunity.opportunityType)}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="neutral">{opportunity.subsystem}</Badge>
                    <Badge variant="accent">{opportunity.severity}</Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-content-secondary">
                  {opportunity.evidenceSummary}
                </p>
                <p className="mt-2 text-xs text-content-muted">
                  {opportunity.sourceMetric}: {opportunity.baselineValue} ·{" "}
                  {formatShortDate(opportunity.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
