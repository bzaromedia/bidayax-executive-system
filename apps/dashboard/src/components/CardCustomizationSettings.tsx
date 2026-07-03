import type { CustomerCardSettings } from "@bidayax/types";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import { AvatarUploadSettings } from "./AvatarUploadSettings";
import { BrandThemeSettings } from "./BrandThemeSettings";
import { CalendarSettingsPanel } from "./CalendarSettingsPanel";
import { CustomizationPreview } from "./CustomizationPreview";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { QRFeedbackSettingsPanel } from "./QRFeedbackSettingsPanel";
import { ReceptionistSettingsPanel } from "./ReceptionistSettingsPanel";
import { ThemeValidationPanel } from "./ThemeValidationPanel";

type CardCustomizationSettingsProps = {
  readonly settings: readonly CustomerCardSettings[];
};

export function CardCustomizationSettings({
  settings
}: CardCustomizationSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Modular Card Customization</CardTitle>
              <CardDescription>
                Configuration separates the Executive Card template from each
                customer profile, brand, avatar, action, calendar,
                receptionist, and QR feedback setting.
              </CardDescription>
            </div>
            <Badge variant="accent">Configuration-driven</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {settings.map((item) => (
              <CustomizationPreview key={item.profile.executiveSlug} settings={item} />
            ))}
          </div>
        </CardContent>
      </Card>
      {settings.map((item) => (
        <section key={item.profile.executiveSlug} className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-content-primary">
                {item.profile.displayName}
              </h2>
              <p className="text-sm text-content-secondary">
                {item.profile.role} at {item.profile.company}
              </p>
            </div>
            <Badge variant="neutral">{item.profile.executiveSlug}</Badge>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ProfileSettingsForm settings={item.profile} />
            <AvatarUploadSettings settings={item.avatar} />
            <BrandThemeSettings settings={item.brandTheme} />
            <ThemeValidationPanel settings={item.brandTheme} />
            <ReceptionistSettingsPanel settings={item.receptionist} />
            <CalendarSettingsPanel settings={item.calendar} />
            <QRFeedbackSettingsPanel settings={item.qrFeedback} />
          </div>
        </section>
      ))}
    </div>
  );
}
