import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardReceptionistInteraction } from "../types/dashboard";
import { formatDateTime } from "../lib/formatters";
import {
  receptionistChannelLabels,
  receptionistInteractionTypeLabels,
  receptionistPriorityLabels
} from "../lib/receptionist-formatters";

type ReceptionistInteractionFeedProps = {
  readonly interactions: readonly DashboardReceptionistInteraction[];
};

export function ReceptionistInteractionFeed({
  interactions
}: ReceptionistInteractionFeedProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Simulation</Badge>
        <CardTitle>Receptionist interaction feed</CardTitle>
        <CardDescription>
          Recent simulated receptionist interactions. No production calls or messages.
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
                    {receptionistInteractionTypeLabels[interaction.interactionType]}
                  </p>
                  <p className="mt-1 text-xs text-content-muted">
                    {receptionistChannelLabels[interaction.channel]} for {interaction.executiveName}
                  </p>
                </div>
                <p className="text-xs text-content-muted">
                  {receptionistPriorityLabels[interaction.priority]} priority
                </p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-content-secondary">
                {interaction.summary}
              </p>
              <p className="mt-3 text-xs text-content-muted">
                {interaction.language}
                {interaction.dialect ? ` / ${interaction.dialect}` : ""} /{" "}
                {formatDateTime(interaction.createdAt)}
              </p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
