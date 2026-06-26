import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardRecentInteraction } from "../types/dashboard";
import { eventTypeLabels, formatDateTime, formatSource } from "../lib/formatters";

type RecentInteractionFeedProps = {
  readonly interactions: readonly DashboardRecentInteraction[];
};

export function RecentInteractionFeed({ interactions }: RecentInteractionFeedProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Recent</Badge>
        <CardTitle>Recent interaction feed</CardTitle>
        <CardDescription>Latest anonymous ledger events without raw IPs.</CardDescription>
      </CardHeader>
      <CardContent>
        {interactions.length === 0 ? (
          <p className="text-sm text-content-muted">No recent interactions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs uppercase text-content-muted">
                  <th className="pb-3 pr-4 font-heading font-semibold">Event</th>
                  <th className="pb-3 pr-4 font-heading font-semibold">Executive</th>
                  <th className="pb-3 pr-4 font-heading font-semibold">Device</th>
                  <th className="pb-3 pr-4 font-heading font-semibold">Source</th>
                  <th className="pb-3 font-heading font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {interactions.map((interaction) => (
                  <tr key={interaction.id} className="border-b border-border-subtle last:border-0">
                    <td className="py-4 pr-4 text-content-primary">
                      {eventTypeLabels[interaction.eventType]}
                    </td>
                    <td className="py-4 pr-4 text-content-secondary">
                      {interaction.executiveName}
                    </td>
                    <td className="py-4 pr-4 text-content-secondary">
                      {interaction.deviceType} / {interaction.browser} / {interaction.os}
                    </td>
                    <td className="py-4 pr-4 text-content-secondary">
                      {formatSource(interaction.referrer ?? interaction.sourceUrl)}
                    </td>
                    <td className="py-4 text-content-secondary">
                      <time dateTime={interaction.createdAt}>
                        {formatDateTime(interaction.createdAt)}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
