import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardIntentSignal, DashboardStatus } from "../types/dashboard";
import { IntentScoreCard } from "./IntentScoreCard";

type PrioritySignalsProps = {
  readonly signals: readonly DashboardIntentSignal[];
  readonly status: DashboardStatus;
  readonly statusMessage: string;
};

export function PrioritySignals({
  signals,
  status,
  statusMessage
}: PrioritySignalsProps) {
  if (signals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Badge variant={status === "ready" ? "neutral" : "accent"}>Intent</Badge>
          <CardTitle>Top intent signals</CardTitle>
          <CardDescription>{statusMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-content-muted">
            Intent signals appear after `intent_scores` contains recalculated rows.
            The dashboard will not invent leads or visitor identities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="top-intent-signals">
      <div>
        <Badge variant="accent">Intent</Badge>
        <h2
          id="top-intent-signals"
          className="mt-3 font-heading text-xl font-semibold text-content-primary"
        >
          Top intent signals
        </h2>
        <p className="mt-2 text-sm text-content-muted">
          Anonymous sessions ranked by deterministic scoring. These are signals,
          not confirmed leads.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {signals.map((signal) => (
          <IntentScoreCard key={signal.id} signal={signal} />
        ))}
      </div>
    </section>
  );
}
