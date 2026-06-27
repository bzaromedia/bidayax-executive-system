import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { VoiceRuntimeReadinessResult } from "@bidayax/types";
import {
  liveVoiceReasonLabels,
  voiceRuntimeStatusLabels,
  voiceSafetyGateStatusLabels
} from "../lib/live-provider-formatters";

type VoiceRuntimeSafetyPanelProps = {
  readonly voiceRuntime: VoiceRuntimeReadinessResult;
};

export function VoiceRuntimeSafetyPanel({
  voiceRuntime
}: VoiceRuntimeSafetyPanelProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Voice runtime</Badge>
        <CardTitle>Voice runtime safety gate</CardTitle>
        <CardDescription>
          OpenAI Realtime is readiness-checked only. No live audio session is
          started from this dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-bxMd border border-border-subtle bg-surface-panel p-4">
            <p className="text-xs uppercase tracking-wide text-content-muted">
              Runtime provider
            </p>
            <p className="mt-2 text-sm font-semibold text-content-primary">
              {voiceRuntime.provider === "openai_realtime"
                ? "OpenAI Realtime"
                : "None"}
            </p>
          </div>
          <div className="rounded-bxMd border border-border-subtle bg-surface-panel p-4">
            <p className="text-xs uppercase tracking-wide text-content-muted">
              Runtime status
            </p>
            <p className="mt-2 text-sm font-semibold text-content-primary">
              {voiceRuntimeStatusLabels[voiceRuntime.status]}
            </p>
          </div>
          <div className="rounded-bxMd border border-border-subtle bg-surface-panel p-4">
            <p className="text-xs uppercase tracking-wide text-content-muted">
              Safety gate
            </p>
            <p className="mt-2 text-sm font-semibold text-content-primary">
              {voiceSafetyGateStatusLabels[voiceRuntime.safetyGateStatus]}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {voiceRuntime.reasonCodes.length === 0 ? (
            <Badge variant="accent">No blocking reason codes</Badge>
          ) : (
            voiceRuntime.reasonCodes.map((reason) => (
              <Badge key={reason} variant="neutral">
                {liveVoiceReasonLabels[reason]}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

