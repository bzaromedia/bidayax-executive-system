import { createCustomerCardSettingsFromExecutiveProfile } from "@bidayax/card-customization";
import { executiveProfiles } from "@bidayax/config/executives";
import { CardCustomizationSettings } from "@/components/CardCustomizationSettings";
import { DashboardShell } from "@/components/DashboardShell";

export default function CardCustomizationSettingsPage() {
  const generatedAt = new Date().toISOString();
  const settings = executiveProfiles.map((profile) =>
    createCustomerCardSettingsFromExecutiveProfile(profile)
  );

  return (
    <DashboardShell
      description="Configure customer-specific profile, brand, avatar, action, calendar, receptionist, and QR feedback settings without changing the shared Executive Card template."
      generatedAt={generatedAt}
      status="ready"
      title="Card Customization Settings"
    >
      <CardCustomizationSettings
        apiIntegration={{
          cacheStrategy:
            "Tenant and card scoped cache keys; publish invalidates published card, brand token, and version-history entries.",
          persistenceMode: process.env.DATABASE_URL
            ? "database_configured"
            : "fallback_defaults",
          routes: [
            "/api/settings/card-customization/[slug]",
            "/api/settings/theme/[slug]",
            "/api/settings/receptionist/[slug]",
            "/api/settings/qr-feedback/[slug]"
          ],
          warning: process.env.DATABASE_URL
            ? null
            : "DATABASE_URL is not configured locally. Reads use source-of-truth defaults and writes return a safe database_unconfigured response."
        }}
        settings={settings}
      />
    </DashboardShell>
  );
}
