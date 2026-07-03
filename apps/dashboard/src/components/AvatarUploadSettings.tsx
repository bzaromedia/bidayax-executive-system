import type { ExecutiveAvatarConfig } from "@bidayax/types";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@bidayax/ui";

type AvatarUploadSettingsProps = {
  readonly settings: ExecutiveAvatarConfig;
};

export function AvatarUploadSettings({ settings }: AvatarUploadSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Avatar Asset</CardTitle>
            <CardDescription>
              Stores a safe image reference and falls back to initials when the
              image is unavailable.
            </CardDescription>
          </div>
          <Badge variant={settings.validationStatus === "valid" ? "accent" : "neutral"}>
            {settings.validationStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Avatar URL</span>
            <Input readOnly value={settings.avatarUrl ?? "Initials fallback"} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Initials</span>
            <Input readOnly value={settings.initials} />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
