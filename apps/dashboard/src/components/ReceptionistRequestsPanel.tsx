import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardReceptionistInteraction } from "../types/dashboard";
import { formatDateTime } from "../lib/formatters";
import {
  receptionistChannelLabels,
  receptionistInteractionTypeLabels,
  receptionistPriorityLabels
} from "../lib/receptionist-formatters";

type ReceptionistRequestsPanelProps = {
  readonly interactions: readonly DashboardReceptionistInteraction[];
};

function formatRequestType(value: string | null) {
  if (!value) {
    return "Workflow request";
  }

  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function ReceptionistRequestsPanel({
  interactions
}: ReceptionistRequestsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Receptionist</Badge>
        <CardTitle>Receptionist request queue</CardTitle>
        <CardDescription>
          Card-submitted workflow requests for human-approved executive follow-up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interactions.map((interaction) => (
            <article
              key={interaction.id}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold text-content-primary">
                    {formatRequestType(interaction.requestType)}
                  </p>
                  <p className="mt-1 text-xs text-content-muted">
                    {interaction.requesterName ?? "Unknown requester"}
                    {interaction.requesterCompany
                      ? ` / ${interaction.requesterCompany}`
                      : ""}{" "}
                    for {interaction.executiveName}
                  </p>
                </div>
                <p className="text-xs text-content-muted">
                  {formatDateTime(interaction.createdAt)}
                </p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-content-secondary">
                {interaction.summary}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-content-muted">
                <span>{receptionistInteractionTypeLabels[interaction.interactionType]}</span>
                <span>{receptionistChannelLabels[interaction.channel]}</span>
                <span>{interaction.language}</span>
                {interaction.dialect ? <span>{interaction.dialect}</span> : null}
                <span>{receptionistPriorityLabels[interaction.priority]} priority</span>
                <span>Follow-up: {interaction.followUpState}</span>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

