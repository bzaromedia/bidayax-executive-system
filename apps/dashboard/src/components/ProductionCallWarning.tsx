import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardLiveProviderSummary } from "@bidayax/types";
import { liveVoiceReasonLabels } from "../lib/live-provider-formatters";

type ProductionCallWarningProps = {
  readonly summary: DashboardLiveProviderSummary;
};

export function ProductionCallWarning({ summary }: ProductionCallWarningProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant={summary.productionVoiceAllowed ? "accent" : "neutral"}>
          Safety gate
        </Badge>
        <CardTitle>Production call warning</CardTitle>
        <CardDescription>
          Production calling remains disabled unless all safety gates pass.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-content-secondary">
          {summary.productionVoiceAllowed
            ? "All configured Phase 10 production gates currently pass."
            : "Production voice is blocked. The system is prepared for integration, not autonomous operation."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {summary.blockedReasonCodes.map((reason) => (
            <Badge key={reason} variant="neutral">
              {liveVoiceReasonLabels[reason]}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

