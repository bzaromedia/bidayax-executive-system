import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Grid } from "@bidayax/ui";
import type { ImprovementEngineSummary as ImprovementEngineSummaryData } from "@bidayax/types";
import { formatInteger } from "../lib/formatters";
import { formatScore } from "../lib/improvement-formatters";

type ImprovementEngineSummaryProps = {
  readonly summary: ImprovementEngineSummaryData;
};

export function ImprovementEngineSummary({ summary }: ImprovementEngineSummaryProps) {
  const rows = [
    ["Opportunities", formatInteger(summary.opportunityCount)],
    ["Candidates", formatInteger(summary.candidateCount)],
    ["Pending review", formatInteger(summary.pendingApprovalCount)],
    ["Approved for sandbox", formatInteger(summary.approvedCount)],
    ["Rejected", formatInteger(summary.rejectedCount)],
    ["Lineage records", formatInteger(summary.archivedLineageCount)],
    ["Avg evidence", formatScore(summary.averageEvidenceScore)],
    ["Avg risk", formatScore(summary.averageRiskScore)]
  ] as const;

  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Phase 13</Badge>
        <CardTitle>Evolutionary improvement engine</CardTitle>
        <CardDescription>
          Telemetry-backed improvement proposals. Nothing here has been
          implemented or deployed automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Grid columns={4} gap={3}>
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <p className="text-xs uppercase tracking-wide text-content-muted">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold text-content-primary">
                {value}
              </p>
            </div>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
