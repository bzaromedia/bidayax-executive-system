import type { BrandThemeConfig } from "@bidayax/types";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@bidayax/ui";

type BrandThemeSettingsProps = {
  readonly settings: BrandThemeConfig;
};

export function BrandThemeSettings({ settings }: BrandThemeSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Brand Theme</CardTitle>
            <CardDescription>
              Approved aliases for customer colors, logo references, and type
              families.
            </CardDescription>
          </div>
          <Badge variant={settings.approved ? "accent" : "neutral"}>
            {settings.approved ? "Approved" : "Review needed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Brand</span>
            <Input readOnly value={settings.brandName} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Theme</span>
            <Input readOnly value={settings.themeId} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Display font</span>
            <Input readOnly value={settings.fontDisplay} />
          </label>
          <label className="space-y-1 text-sm text-content-secondary">
            <span>Body font</span>
            <Input readOnly value={settings.fontBody} />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
