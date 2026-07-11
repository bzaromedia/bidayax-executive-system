import type { ReactNode } from "react";
import type {
  CustomerCardSettings,
  ReceptionistSettings,
  TenantBrandProfile
} from "@bidayax/types";
import { isReceptionistLanguage } from "@bidayax/types";
import {
  createReceptionistSettingsPreview,
  type ReceptionistSettingsPreview
} from "@bidayax/settings";
import { radiusTokens, resolveBrandTokens } from "@bidayax/tokens";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@bidayax/ui";
import { AvatarUploadSettings } from "./AvatarUploadSettings";
import { BrandThemeSettings } from "./BrandThemeSettings";
import { CalendarSettingsPanel } from "./CalendarSettingsPanel";
import { CustomizationPreview } from "./CustomizationPreview";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { QRFeedbackSettingsPanel } from "./QRFeedbackSettingsPanel";
import { ReceptionistSettingsPanel } from "./ReceptionistSettingsPanel";
import { ThemeValidationPanel } from "./ThemeValidationPanel";

type CardCustomizationSettingsProps = {
  readonly apiIntegration?: SettingsApiIntegrationState;
  readonly settings: readonly CustomerCardSettings[];
};

type SettingsApiIntegrationState = {
  readonly cacheStrategy: string;
  readonly persistenceMode: "database_configured" | "fallback_defaults";
  readonly routes: readonly string[];
  readonly warning: string | null;
};

type Phase4SettingsPreviewState = {
  readonly settings: CustomerCardSettings;
  readonly tenantBrandProfile: TenantBrandProfile;
  readonly resolvedTokens: ReturnType<typeof resolveBrandTokens>;
  readonly receptionistPreview: ReceptionistSettingsPreview;
  readonly activeActionCount: number;
};

type SettingsSectionProps = {
  readonly badge: string;
  readonly children: ReactNode;
  readonly description: string;
  readonly title: string;
};

function createTenantBrandProfile(settings: CustomerCardSettings): TenantBrandProfile {
  return {
    accentColor: settings.brandTheme.accentColor,
    backgroundColor: settings.brandTheme.backgroundColor,
    buttonRadius: radiusTokens.lg,
    cardRadius: radiusTokens.xl,
    companyName: settings.profile.company,
    contrastMode: "standard",
    createdAt: settings.profile.updatedAt,
    faviconAssetId: settings.brandTheme.logoMarkUrl,
    fontFamily: settings.brandTheme.fontBody,
    logoAssetId: settings.brandTheme.logoUrl,
    motionIntensity: "standard",
    primaryColor: settings.brandTheme.primaryColor,
    secondaryColor: settings.brandTheme.secondaryColor,
    tenantId: settings.brandTheme.ownerId,
    textColor: settings.brandTheme.textColor,
    updatedAt: settings.profile.updatedAt
  };
}

function createReceptionistPreviewSettings(
  settings: CustomerCardSettings
): ReceptionistSettings {
  const configuredLanguages = settings.receptionist.supportedLanguages.filter(
    isReceptionistLanguage
  );
  const defaultLanguage = isReceptionistLanguage(
    settings.receptionist.defaultLanguage
  )
    ? settings.receptionist.defaultLanguage
    : "English";
  const supportedLanguages = configuredLanguages.includes(defaultLanguage)
    ? configuredLanguages
    : [defaultLanguage, ...configuredLanguages];

  return {
    afterHoursBehavior: "queue_next_business_day",
    appointmentRules: {
      allowedWindows: settings.calendar.availableSlotLabels,
      calendarUrl: settings.calendar.externalCalendarUrl,
      enabled: settings.calendar.enabled,
      requireHumanApproval: true,
      timezone: "America/New_York"
    },
    callRoutingRules: settings.receptionist.requestTypes.map(
      (requestType, index) => ({
        action:
          requestType === "request_callback"
            ? "queue_callback" as const
            : "route_to_email" as const,
        condition: `intent is ${requestType}`,
        destination: settings.receptionist.handoffEmail,
        enabled: settings.receptionist.enabled,
        intent: requestType,
        label: `${requestType.replaceAll("_", " ")} route`,
        priority: index === 0 ? "high" as const : "medium" as const,
        ruleId: `${settings.receptionist.receptionistId}-${requestType}`
      })
    ),
    consentDisclosure: settings.receptionist.consentRequired
      ? "This AI receptionist may route and summarize your request."
      : "",
    customGreeting: settings.receptionist.customGreeting,
    defaultLanguage,
    enabled: settings.receptionist.enabled,
    escalationContacts: [
      {
        contactId: `${settings.receptionist.receptionistId}-handoff`,
        email: settings.receptionist.handoffEmail,
        label: "Executive handoff",
        phone: null,
        preferredContactMethod: "email",
        priority: "high"
      }
    ],
    fallbackBehavior: "queue_callback",
    greetingMode: settings.receptionist.greetingMode,
    mood: settings.receptionist.mood,
    recordingPolicy: "disabled",
    standardGreeting: settings.receptionist.standardGreeting,
    supportedLanguages,
    tenantId: settings.brandTheme.ownerId,
    voiceProfile: settings.receptionist.voiceStyle
  };
}

function createApiBackedPreviewState(
  settings: readonly CustomerCardSettings[]
): readonly Phase4SettingsPreviewState[] {
  return settings.map((item) => {
    const tenantBrandProfile = createTenantBrandProfile(item);
    const resolvedTokens = resolveBrandTokens(tenantBrandProfile, {
      createdAt: item.profile.updatedAt
    });
    const receptionistPreview = createReceptionistSettingsPreview(
      createReceptionistPreviewSettings(item),
      item.profile.updatedAt
    );
    const activeActionCount = [
      item.actions.callEnabled,
      item.actions.emailEnabled,
      item.actions.connectEnabled,
      item.actions.websiteEnabled,
      item.actions.downloadEnabled,
      item.actions.shareEnabled
    ].filter(Boolean).length;

    return {
      activeActionCount,
      resolvedTokens,
      receptionistPreview,
      settings: item,
      tenantBrandProfile
    };
  });
}

function SettingsSection({ badge, children, description, title }: SettingsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="neutral">{badge}</Badge>
          <h3 className="mt-3 font-heading text-xl font-semibold text-content-primary">
            {title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-content-secondary">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ActionStateBadges({ settings }: { readonly settings: CustomerCardSettings }) {
  const actions = [
    ["Call", settings.actions.callEnabled],
    ["Email", settings.actions.emailEnabled],
    ["Connect", settings.actions.connectEnabled],
    ["Website", settings.actions.websiteEnabled],
    ["Download", settings.actions.downloadEnabled],
    ["Share", settings.actions.shareEnabled]
  ] as const;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {actions.map(([label, enabled]) => (
        <Badge key={label} variant={enabled ? "accent" : "neutral"}>
          {label} {enabled ? "enabled" : "disabled"}
        </Badge>
      ))}
    </div>
  );
}

function CardContentSummary({ settings }: { readonly settings: CustomerCardSettings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Content</CardTitle>
        <CardDescription>
          Preview-only content values rendered by the shared Executive Card
          template.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              Tagline
            </dt>
            <dd className="mt-1 text-sm text-content-primary">
              {settings.profile.tagline}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              Website
            </dt>
            <dd className="mt-1 break-words text-sm text-content-primary">
              {settings.profile.website}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              Bio
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-content-primary">
              {settings.profile.bio}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              Address
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-content-primary">
              {settings.profile.addressLine1}
              <br />
              {settings.profile.addressLine2}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function ButtonsAndLinksPanel({ settings }: { readonly settings: CustomerCardSettings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buttons & Links</CardTitle>
        <CardDescription>
          Action visibility is driven by typed configuration and previewed before
          publish.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ActionStateBadges settings={settings} />
        <div className="rounded-bxLg border border-border-subtle bg-surface-inset p-4">
          <p className="text-sm leading-relaxed text-content-secondary">
            Social links and CTA ordering stay inside the settings snapshot and
            will be connected to the publish flow in Pending.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ResolvedTokenPreview({ item }: { readonly item: Phase4SettingsPreviewState }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Resolved Brand Tokens</CardTitle>
            <CardDescription>
              Phase 4 API-backed preview state generated through the Phase 2B token resolver and ready for persisted draft, preview, and publish workflows.
            </CardDescription>
          </div>
          <Badge variant={item.resolvedTokens.accessibility.fallbackApplied ? "neutral" : "accent"}>
            {item.resolvedTokens.accessibility.wcagLevel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              Snapshot hash
            </dt>
            <dd className="mt-1 break-words font-mono text-sm text-content-primary">
              {item.resolvedTokens.snapshotHash}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              Resolver
            </dt>
            <dd className="mt-1 text-sm text-content-primary">
              {item.resolvedTokens.resolverVersion}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              Text contrast
            </dt>
            <dd className="mt-1 text-sm text-content-primary">
              {item.resolvedTokens.accessibility.textOnBackgroundContrast}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              Action contrast
            </dt>
            <dd className="mt-1 text-sm text-content-primary">
              {item.resolvedTokens.accessibility.actionContrast}
            </dd>
          </div>
        </dl>
        {item.resolvedTokens.warnings.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-content-secondary">
            {item.resolvedTokens.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-content-secondary">
            No resolver warnings for this preview snapshot.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PublishReadinessPanel({ item }: { readonly item: Phase4SettingsPreviewState }) {
  const checks = [
    ["Brand tokens resolved", true],
    ["Profile content present", item.settings.profile.displayName.length > 0],
    ["Receptionist consent configured", item.settings.receptionist.consentRequired],
    ["QR feedback configured", item.settings.qrFeedback.qrFeedbackSettingsId.length > 0],
    ["Active actions available", item.activeActionCount > 0],
    ["Settings API route available", true],
    ["Tenant authorization modeled", true],
    ["PostgreSQL disposable integration pending", false]
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Publish Readiness</CardTitle>
            <CardDescription>
              Phase 4 connects preview gating to tenant-aware APIs, persisted versions, authorization checks, cache invalidation, and audit-aware publish workflows.
            </CardDescription>
          </div>
          <Badge variant="neutral">Preview only</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 md:grid-cols-2">
          {checks.map(([label, passed]) => (
            <li
              key={label}
              className="flex items-center justify-between gap-3 rounded-bxMd border border-border-subtle bg-surface-inset px-3 py-2 text-sm"
            >
              <span className="text-content-secondary">{label}</span>
              <Badge variant={passed ? "accent" : "neutral"}>
                {passed ? "Ready" : "Pending"}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SettingsApiIntegrationSummary({
  state
}: {
  readonly state: SettingsApiIntegrationState;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Phase 4 API Integration</CardTitle>
            <CardDescription>
              Settings load through tenant-aware API contracts with persisted
              workflow support, cache keys scoped by tenant and card, and safe
              fallback behavior when DATABASE_URL is not configured locally.
            </CardDescription>
          </div>
          <Badge variant={state.persistenceMode === "database_configured" ? "accent" : "neutral"}>
            {state.persistenceMode === "database_configured" ? "Database configured" : "Fallback defaults"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-bxLg border border-border-subtle bg-surface-inset p-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              Cache Strategy
            </p>
            <p className="mt-2 text-sm text-content-primary">{state.cacheStrategy}</p>
          </div>
          <div className="rounded-bxLg border border-border-subtle bg-surface-inset p-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">
              API Routes
            </p>
            <p className="mt-2 text-sm text-content-primary">{state.routes.length} configured</p>
          </div>
        </div>
        {state.warning ? (
          <p className="text-sm leading-relaxed text-content-secondary">{state.warning}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CardCustomizationSettings({
  apiIntegration = {
    cacheStrategy: "Tenant and card scoped cache keys; publish invalidates card settings and resolved token snapshots.",
    persistenceMode: "fallback_defaults",
    routes: [
      "/api/settings/card-customization/[slug]",
      "/api/settings/theme/[slug]",
      "/api/settings/receptionist/[slug]",
      "/api/settings/qr-feedback/[slug]"
    ],
    warning: "DATABASE_URL is not configured in this environment, so writes are blocked until persistence is available."
  },
  settings
}: CardCustomizationSettingsProps) {
  const previewState = createApiBackedPreviewState(settings);

  return (
    <div className="space-y-8">
      <SettingsApiIntegrationSummary state={apiIntegration} />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Executive Card Settings Dashboard</CardTitle>
              <CardDescription>
                Preview-first configuration shell for brand, profile, card
                content, actions, QR behavior, receptionist settings, preview,
                and publish readiness through tenant-aware settings APIs.
              </CardDescription>
            </div>
            <Badge variant="accent">Phase 4</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              "Brand",
              "Profile",
              "Card Content",
              "Buttons & Links",
              "QR Behavior",
              "Polyglot Receptionist",
              "Preview",
              "Publish"
            ].map((section) => (
              <Badge key={section} variant="neutral">
                {section}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {previewState.map((item) => (
        <article key={item.settings.profile.executiveSlug} className="space-y-8">
          <header className="flex flex-col gap-3 border-b border-border-subtle pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="neutral">{item.settings.profile.executiveSlug}</Badge>
              <h2 className="mt-3 font-display text-2xl font-semibold text-content-primary">
                {item.settings.profile.displayName}
              </h2>
              <p className="mt-1 text-sm text-content-secondary">
                {item.settings.profile.role} at {item.settings.profile.company}
              </p>
            </div>
            <Badge variant={item.resolvedTokens.accessibility.fallbackApplied ? "neutral" : "accent"}>
              {item.resolvedTokens.accessibility.fallbackApplied
                ? "Fallback applied"
                : "Preview valid"}
            </Badge>
          </header>

          <SettingsSection
            badge="Brand"
            description="Client brand values resolve through packages/tokens before any preview or publish workflow can consume them."
            title="Brand Configuration"
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <BrandThemeSettings settings={item.settings.brandTheme} />
              <ThemeValidationPanel settings={item.settings.brandTheme} />
              <ResolvedTokenPreview item={item} />
            </div>
          </SettingsSection>

          <SettingsSection
            badge="Profile"
            description="Executive identity and avatar references are editable settings that remain separate from the shared card template."
            title="Profile Settings"
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <ProfileSettingsForm settings={item.settings.profile} />
              <AvatarUploadSettings settings={item.settings.avatar} />
            </div>
          </SettingsSection>

          <SettingsSection
            badge="Card Content"
            description="Card copy, company information, location, and website fields are previewed from typed configuration."
            title="Card Content"
          >
            <CardContentSummary settings={item.settings} />
          </SettingsSection>

          <SettingsSection
            badge="Buttons & Links"
            description="Contact actions and link behavior are controlled by settings instead of hardcoded card UI branches."
            title="Buttons & Links"
          >
            <ButtonsAndLinksPanel settings={item.settings} />
          </SettingsSection>

          <SettingsSection
            badge="QR Behavior"
            description="QR transfer feedback options remain receiver-safe and previewable without changing QR route behavior."
            title="QR Behavior"
          >
            <QRFeedbackSettingsPanel settings={item.settings.qrFeedback} />
          </SettingsSection>

          <SettingsSection
            badge="Polyglot Receptionist"
            description="Receptionist preferences configure language, greeting, tone, request routing, handoff email, and consent behavior."
            title="Polyglot Receptionist Settings"
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <ReceptionistSettingsPanel
                preview={item.receptionistPreview}
                settings={item.settings.receptionist}
              />
              <CalendarSettingsPanel settings={item.settings.calendar} />
            </div>
          </SettingsSection>

          <SettingsSection
            badge="Preview"
            description="Preview cards consume the same typed settings that future published versions will snapshot."
            title="Preview"
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <CustomizationPreview settings={item.settings} />
              <ResolvedTokenPreview item={item} />
            </div>
          </SettingsSection>

          <SettingsSection
            badge="Publish"
            description="Publishing remains disabled in Phase 2C until immutable versioning and audit events are implemented."
            title="Publish Gate"
          >
            <PublishReadinessPanel item={item} />
          </SettingsSection>
        </article>
      ))}
    </div>
  );
}
