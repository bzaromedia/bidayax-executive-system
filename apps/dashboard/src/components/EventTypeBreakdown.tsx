import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardEventTypeBreakdown } from "../types/dashboard";
import { formatInteger, formatPercent } from "../lib/formatters";

type EventTypeBreakdownProps = {
  readonly rows: readonly DashboardEventTypeBreakdown[];
};

export function EventTypeBreakdown({ rows }: EventTypeBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Events</Badge>
        <CardTitle>Activity by event type</CardTitle>
        <CardDescription>Ledger distribution across card and action events.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.eventType} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <p className="font-heading text-sm font-semibold text-content-primary">
                  {row.label}
                </p>
                <p className="text-sm text-content-secondary">
                  {formatInteger(row.count)} / {formatPercent(row.share)}
                </p>
              </div>
              <div
                aria-label={`${row.label} ${formatPercent(row.share)}`}
                className="h-2 overflow-hidden rounded-bxSm bg-surface-inset"
                role="img"
              >
                <div
                  className="h-full rounded-bxSm bg-border-strong"
                  style={{ width: `${Math.max(row.share * 100, row.count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
