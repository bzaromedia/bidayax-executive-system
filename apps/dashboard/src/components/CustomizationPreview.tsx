import type { CustomerCardSettings } from "@bidayax/types";
import { resolveBrandThemeConfig, resolveExecutiveAvatar } from "@bidayax/card-customization";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";

type CustomizationPreviewProps = {
  readonly settings: CustomerCardSettings;
};

export function CustomizationPreview({ settings }: CustomizationPreviewProps) {
  const theme = resolveBrandThemeConfig(settings.brandTheme);
  const avatar = resolveExecutiveAvatar(settings.avatar, settings.profile);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{settings.profile.displayName}</CardTitle>
            <CardDescription>{settings.profile.role}</CardDescription>
          </div>
          <Badge variant={theme.usedFallback ? "neutral" : "accent"}>
            {theme.usedFallback ? "Default theme" : "Customer theme"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-border-muted bg-surface-inset font-display text-lg font-semibold text-content-accent">
            {avatar.kind === "image" ? (
              <span aria-label={avatar.altText}>{avatar.initials}</span>
            ) : (
              <span aria-hidden="true">{avatar.initials}</span>
            )}
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-content-primary">
              {settings.profile.company}
            </p>
            <p className="text-sm text-content-secondary">
              {settings.profile.tagline}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
