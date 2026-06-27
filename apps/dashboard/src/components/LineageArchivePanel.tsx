import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardImprovementLineage } from "@bidayax/types";
import { formatShortDate } from "../lib/formatters";
import { formatImprovementLabel } from "../lib/improvement-formatters";

type LineageArchivePanelProps = {
  readonly lineage: readonly DashboardImprovementLineage[];
};

export function LineageArchivePanel({ lineage }: LineageArchivePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lineage archive</CardTitle>
        <CardDescription>
          Candidate lineage with rollback requirements and no fake outcome metrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lineage.length === 0 ? (
          <p className="text-sm text-content-muted">No lineage records archived.</p>
        ) : (
          <div className="space-y-3">
            {lineage.map((entry) => (
              <div
                key={entry.id}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-content-primary">{entry.variantId}</p>
                  <Badge variant="neutral">
                    {formatImprovementLabel(entry.approvalStatus)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-content-secondary">
                  {entry.rollbackPlan}
                </p>
                <p className="mt-2 text-xs text-content-muted">
                  Metrics after: {entry.metricsAfterIsEmpty ? "not measured yet" : "recorded"} ·{" "}
                  {formatShortDate(entry.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
