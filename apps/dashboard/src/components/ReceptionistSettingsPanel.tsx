import type { ReceptionistSettingsConfig } from "@bidayax/types";
import { resolveReceptionistBehavior } from "@bidayax/card-customization";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@bidayax/ui";

type ReceptionistSettingsPanelProps = {
  readonly settings: ReceptionistSettingsConfig;
};

export function ReceptionistSettingsPanel({ settings }: ReceptionistSettingsPanelProps) {
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
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
