import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardMetric } from "../types/dashboard";

type MetricCardProps = {
  readonly metric: DashboardMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="text-2xl font-semibold">{metric.value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-content-muted">{metric.detail}</p>
      </CardContent>
    </Card>
  );
}
