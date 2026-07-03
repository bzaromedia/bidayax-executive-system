import type { CardCustomizationProfile } from "@bidayax/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@bidayax/ui";

type ProfileSettingsFormProps = {
  readonly settings: CardCustomizationProfile;
};

export function ProfileSettingsForm({ settings }: ProfileSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Customer identity values that populate the production card template.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Display name</span>
            <Input readOnly value={settings.displayName} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Role</span>
            <Input readOnly value={settings.role} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Phone</span>
            <Input readOnly value={settings.phone} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Email</span>
            <Input readOnly value={settings.email} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary md:col-span-2">
            <span>Tagline</span>
            <Input readOnly value={settings.tagline} />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
