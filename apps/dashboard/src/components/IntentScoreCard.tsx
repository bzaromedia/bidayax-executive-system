import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardIntentSignal } from "../types/dashboard";
import { formatDateTime } from "../lib/formatters";
import { formatScore, intentReasonLabels } from "../lib/intent-formatters";

type IntentScoreCardProps = {
  readonly signal: DashboardIntentSignal;
};

export function IntentScoreCard({ signal }: IntentScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="accent">{signal.tier}</Badge>
            <CardTitle className="mt-3">{signal.label}</CardTitle>
            <CardDescription>
              {signal.executiveName} / {signal.eventCount} source events
            </CardDescription>
          </div>
          <p className="font-display text-3xl font-semibold text-content-primary">
            {formatScore(signal.score)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {signal.reasonCodes.map((reasonCode) => (
            <Badge key={reasonCode} variant="neutral">
              {intentReasonLabels[reasonCode]}
            </Badge>
          ))}
        </div>
        <p className="mt-4 text-xs text-content-muted">
          {signal.lastEventAt ? (
            <time dateTime={signal.lastEventAt}>
              Last activity {formatDateTime(signal.lastEventAt)}
            </time>
          ) : (
            "No last activity timestamp"
          )}
        </p>
      </CardContent>
    </Card>
  );
}
