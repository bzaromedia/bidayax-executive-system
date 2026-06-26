import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardExecutiveBreakdown } from "../types/dashboard";
import { formatInteger, formatPercent } from "../lib/formatters";

type ExecutiveBreakdownProps = {
  readonly rows: readonly DashboardExecutiveBreakdown[];
};

export function ExecutiveBreakdown({ rows }: ExecutiveBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Executives</Badge>
        <CardTitle>Activity by executive</CardTitle>
        <CardDescription>Interaction volume grouped by executive card.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.executiveSlug} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <p className="font-heading text-sm font-semibold text-content-primary">
                  {row.executiveName}
                </p>
                <p className="text-sm text-content-secondary">
                  {formatInteger(row.count)} / {formatPercent(row.share)}
                </p>
              </div>
              <div
                aria-label={`${row.executiveName} ${formatPercent(row.share)}`}
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
  );
}
