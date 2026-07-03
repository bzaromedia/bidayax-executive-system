import type { QRTransferFeedbackConfig } from "@bidayax/types";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";

type QRFeedbackSettingsPanelProps = {
  readonly settings: QRTransferFeedbackConfig;
};

const enabledLabel = {
  false: "Off",
  true: "On"
} as const satisfies Record<`${boolean}`, string>;

export function QRFeedbackSettingsPanel({ settings }: QRFeedbackSettingsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Transfer Feedback</CardTitle>
        <CardDescription>
          Controls haptic, sound, and animation preferences for the receiving
          device experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          <Badge variant={settings.hapticsEnabled ? "accent" : "neutral"}>
            Haptics {enabledLabel[String(settings.hapticsEnabled) as `${boolean}`]}
          </Badge>
          <Badge variant={settings.soundEnabled ? "accent" : "neutral"}>
            Sound {enabledLabel[String(settings.soundEnabled) as `${boolean}`]}
          </Badge>
          <Badge variant={settings.animationEnabled ? "accent" : "neutral"}>
            Motion {enabledLabel[String(settings.animationEnabled) as `${boolean}`]}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
