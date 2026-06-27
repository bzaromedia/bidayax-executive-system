import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardTelephonyCallEvent } from "../types/dashboard";
import { formatDateTime } from "../lib/formatters";
import {
  telephonyCallStatusLabels,
  telephonyEventLabels,
  telephonyProviderLabels
} from "../lib/telephony-formatters";

type CallLifecycleFeedProps = {
  readonly events: readonly DashboardTelephonyCallEvent[];
};

export function CallLifecycleFeed({ events }: CallLifecycleFeedProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Lifecycle</Badge>
        <CardTitle>Call lifecycle feed</CardTitle>
        <CardDescription>
          Mock or prepared call lifecycle events. Phone numbers are masked.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold text-content-primary">
                    {telephonyEventLabels[event.eventType]}
                  </p>
                  <p className="mt-1 text-xs text-content-muted">
                    {event.executiveName} / {telephonyProviderLabels[event.provider]}
                  </p>
                </div>
                <p className="text-xs text-content-muted">
                  {telephonyCallStatusLabels[event.status]}
                </p>
              </div>
              <p className="mt-3 text-sm text-content-secondary">
                {event.direction} call from {event.maskedFromNumber ?? "masked"} to{" "}
                {event.maskedToNumber ?? "masked"}
              </p>
              <p className="mt-3 text-xs text-content-muted">
                {formatDateTime(event.createdAt)}
              </p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
