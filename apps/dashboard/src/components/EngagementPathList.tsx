import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardEngagementPath } from "../types/dashboard";
import { formatDateTime, formatInteger } from "../lib/formatters";
import { graphEdgeLabels } from "../lib/graph-formatters";

type EngagementPathListProps = {
  readonly paths: readonly DashboardEngagementPath[];
};

export function EngagementPathList({ paths }: EngagementPathListProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Paths</Badge>
        <CardTitle>Engagement paths</CardTitle>
        <CardDescription>
          Recent graph edges connecting anonymous visitors, sessions, events, executives, and scores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {paths.map((path) => (
            <div
              key={path.id}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold text-content-primary">
                    {graphEdgeLabels[path.edgeType]}
                  </p>
                  <p className="mt-1 text-sm text-content-muted">
                    {path.sourceLabel} to {path.targetLabel}
                  </p>
                </div>
                <p className="text-xs text-content-muted">
                  Weight {formatInteger(path.weight)}
                </p>
              </div>
              {path.createdAt ? (
                <p className="mt-3 text-xs text-content-muted">
                  Created {formatDateTime(path.createdAt)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
