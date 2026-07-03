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
      <CardCustomizationSettings settings={settings} />
    </DashboardShell>
  );
}

