import type { CalendarBookingConfig } from "@bidayax/types";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@bidayax/ui";

type CalendarSettingsPanelProps = {
  readonly settings: CalendarBookingConfig;
};

export function CalendarSettingsPanel({ settings }: CalendarSettingsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Calendar Settings</CardTitle>
            <CardDescription>
              Defines how meeting requests are routed from the card experience.
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
            <span>Meeting behavior</span>
            <Input readOnly value={settings.meetingBehavior} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Slot labels</span>
            <Input readOnly value={settings.availableSlotLabels.join(", ")} />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
