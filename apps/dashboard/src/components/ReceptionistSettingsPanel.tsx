import type { ReceptionistSettingsConfig } from "@bidayax/types";
import type { ReceptionistSettingsPreview } from "@bidayax/settings";
import { resolveReceptionistBehavior } from "@bidayax/card-customization";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@bidayax/ui";

type ReceptionistSettingsPanelProps = {
  readonly preview: ReceptionistSettingsPreview;
  readonly settings: ReceptionistSettingsConfig;
};

export function ReceptionistSettingsPanel({
  preview,
  settings
}: ReceptionistSettingsPanelProps) {
  const behavior = resolveReceptionistBehavior(settings);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Polyglot Receptionist Settings</CardTitle>
            <CardDescription>
              Controls routed request handling, language options, greeting, tone,
              and handoff destination.
            </CardDescription>
          </div>
          <Badge variant={settings.enabled ? "accent" : "neutral"}>
            {settings.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={preview.validation.valid ? "accent" : "neutral"}>
            {preview.status}
          </Badge>
          <Badge variant="neutral">{preview.languageSummary}</Badge>
          <Badge variant="neutral">{preview.routingRuleCount} active routes</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Voice style</span>
            <Input readOnly value={settings.voiceStyle} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Mood</span>
            <Input readOnly value={settings.mood} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Default language</span>
            <Input readOnly value={settings.defaultLanguage} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Handoff email</span>
            <Input readOnly value={settings.handoffEmail} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary md:col-span-2">
            <span>Greeting</span>
            <Input readOnly value={behavior.greetingText} />
          </label>
        </div>
        {preview.validation.issues.length > 0 ? (
          <ul className="space-y-2 rounded-bxLg border border-border-subtle bg-surface-inset p-4 text-sm text-content-secondary">
            {preview.validation.issues.map((issue) => (
              <li key={issue.field + ":" + issue.code}>{issue.message}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-content-secondary">
            Receptionist settings are ready for the immutable preview and publish workflow.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
