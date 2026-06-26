import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardStatus } from "../types/dashboard";

type GraphEmptyStateProps = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
};

export function GraphEmptyState({
  status,
  statusMessage
}: GraphEmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant={status === "ready" ? "neutral" : "accent"}>Graph</Badge>
        <CardTitle>Contact graph pending</CardTitle>
        <CardDescription>{statusMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-content-muted">
          Relationship structure appears after `contact_graph_nodes`,
          `contact_graph_edges`, and `contact_graph_snapshots` contain rebuilt
          rows. Anonymous visitors remain anonymous.
        </p>
      </CardContent>
    </Card>
  );
}
