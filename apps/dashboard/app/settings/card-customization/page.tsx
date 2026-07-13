import { headers } from "next/headers";
import { createCustomerCardSettingsFromExecutiveProfile } from "@bidayax/card-customization";
import { executiveProfiles } from "@bidayax/config/executives";
import { CardCustomizationSettings } from "@/components/CardCustomizationSettings";
import { DashboardShell } from "@/components/DashboardShell";
import { IdentityAccessPanel } from "@/components/IdentityAccessPanel";
import { resolveDashboardIdentity } from "@/lib/identity-runtime";

export const dynamic = "force-dynamic";

export default async function CardCustomizationSettingsPage() {
  const generatedAt = new Date().toISOString();
  const settings = executiveProfiles.map((profile) =>
    createCustomerCardSettingsFromExecutiveProfile(profile)
  );
  const first = settings[0];

  if (!first) {
    return null;
  }

  const requestHeaders = await headers();
  const request = new Request(
    new URL(
      "/settings/card-customization",
      process.env.DASHBOARD_BASE_URL ?? "http://localhost:3001"
    ),
    { headers: requestHeaders }
  );
  const identity = await resolveDashboardIdentity({
    request,
    resourceCardId: first.profile.executiveSlug,
    resourceTenantId: first.brandTheme.ownerId
  });

  if (!identity.ok) {
    return (
      <DashboardShell
        description="Authenticate with the configured identity provider before accessing tenant settings."
        generatedAt={generatedAt}
        status="not_configured"
        title="Card Customization Settings"
      >
        <IdentityAccessPanel
          authenticated={false}
          message={identity.reason}
          returnTo="/settings/card-customization"
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      description="Configure customer-specific profile, brand, avatar, action, calendar, receptionist, and QR feedback settings without changing the shared Executive Card template."
      generatedAt={generatedAt}
      status="ready"
      title="Card Customization Settings"
    >
      <IdentityAccessPanel
        authenticated
        message="Identity, tenant membership, role, and card scope were resolved server-side."
        returnTo="/settings/card-customization"
        role={identity.context.role}
      />
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
