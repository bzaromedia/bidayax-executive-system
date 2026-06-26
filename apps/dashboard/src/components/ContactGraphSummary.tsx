import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardContactGraphSummary } from "../types/dashboard";
import { formatInteger } from "../lib/formatters";
import { formatGraphScore } from "../lib/graph-formatters";

type ContactGraphSummaryProps = {
  readonly summary: DashboardContactGraphSummary;
};

export function ContactGraphSummary({ summary }: ContactGraphSummaryProps) {
  const rows = [
    ["Nodes", summary.nodeCount],
    ["Edges", summary.edgeCount],
    ["Snapshots", summary.snapshotCount],
    ["Anonymous visitors", summary.visitorCount],
    ["Sessions", summary.sessionCount],
    ["Executives", summary.executiveCount]
  ] as const;

  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Graph</Badge>
        <CardTitle>Contact graph summary</CardTitle>
        <CardDescription>
          Relationship structure built from first-party interaction and intent data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <p className="text-xs uppercase tracking-wide text-content-muted">
                {label}
              </p>
              <p className="mt-2 font-heading text-2xl font-semibold text-content-primary">
                {formatInteger(value)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-content-muted">
          Highest graph-backed intent signal:{" "}
          <span className="text-content-secondary">
            {formatGraphScore(summary.highestIntentScore)}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
