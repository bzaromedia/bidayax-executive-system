import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardRelationshipSnapshot } from "../types/dashboard";
import { formatDateTime, formatInteger } from "../lib/formatters";
import { formatGraphScore } from "../lib/graph-formatters";

type ExecutiveRelationshipSnapshotProps = {
  readonly snapshots: readonly DashboardRelationshipSnapshot[];
};

export function ExecutiveRelationshipSnapshot({
  snapshots
}: ExecutiveRelationshipSnapshotProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Snapshots</Badge>
        <CardTitle>Executive relationship snapshots</CardTitle>
        <CardDescription>
          Factual summaries of anonymous visitor, session, event, and score links.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <article
              key={snapshot.id}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold text-content-primary">
                    {snapshot.label}
                  </p>
                  <p className="mt-1 text-xs text-content-muted">
                    {snapshot.executiveName}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-content-secondary">
                    {formatGraphScore(snapshot.highestIntentScore)}
                  </p>
                  <p className="mt-1 text-xs text-content-muted">
                    {snapshot.highestIntentTier ?? "No tier"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-content-secondary">
                {snapshot.engagementSummary}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-content-muted">
                <span>{formatInteger(snapshot.totalEvents)} events</span>
                <span>
                  {snapshot.lastActivityAt
                    ? formatDateTime(snapshot.lastActivityAt)
                    : "No recent activity"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
