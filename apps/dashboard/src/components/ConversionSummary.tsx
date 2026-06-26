import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardConversionSummary } from "../types/dashboard";
import { eventTypeLabels, formatInteger, formatPercent } from "../lib/formatters";

type ConversionSummaryProps = {
  readonly rows: readonly DashboardConversionSummary[];
};

export function ConversionSummary({ rows }: ConversionSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Conversion</Badge>
        <CardTitle>Action conversion summaries</CardTitle>
        <CardDescription>Simple ratios from card views to user actions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-4">
          {rows.map((row) => (
            <div
              key={row.key}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <p className="font-heading text-sm font-semibold text-content-primary">
                {row.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-content-primary">
                {row.displayValue}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-content-muted">
                {formatInteger(row.numerator)} {eventTypeLabels[row.numeratorEventType]} from{" "}
                {formatInteger(row.denominator)} card views
              </p>
              <div
                aria-label={`${row.label} ${formatPercent(row.rate)}`}
                className="mt-4 h-2 overflow-hidden rounded-bxSm bg-surface-inset"
                role="img"
              >
                <div
                  className="h-full rounded-bxSm bg-content-accent"
                  style={{ width: `${Math.min(row.rate * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
