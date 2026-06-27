import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardVoiceSession } from "../types/dashboard";
import { formatDateTime } from "../lib/formatters";
import {
  telephonyProviderLabels,
  voiceSessionStatusLabels
} from "../lib/telephony-formatters";

type VoiceSessionStatusProps = {
  readonly sessions: readonly DashboardVoiceSession[];
};

export function VoiceSessionStatus({ sessions }: VoiceSessionStatusProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Voice</Badge>
        <CardTitle>Voice session status</CardTitle>
        <CardDescription>
          Future voice runtime metadata. No audio streaming is active in Phase 9.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold text-content-primary">
                    {voiceSessionStatusLabels[session.status]}
                  </p>
                  <p className="mt-1 text-xs text-content-muted">
                    {telephonyProviderLabels[session.provider]} / {session.voiceModel}
                  </p>
                </div>
                <p className="text-xs text-content-muted">
                  {formatDateTime(session.createdAt)}
                </p>
              </div>
              <p className="mt-3 text-sm text-content-secondary">
                Transcript {session.transcriptStatus}; summary {session.summaryStatus}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
