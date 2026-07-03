# Customer Card Configuration Model

The Customer Card Configuration Model defines the customer-owned settings that render through the shared Executive Card template.

## Model Groups

- `CardCustomizationProfile`: executive identity and contact data.
- `BrandThemeConfig`: customer brand theme and asset references.
- `ExecutiveAvatarConfig`: profile image reference and initials fallback.
- `CardActionConfig`: visible card actions.
- `CalendarBookingConfig`: meeting request behavior.
- `ReceptionistSettingsConfig`: routed request workflow settings.
- `QRTransferFeedbackConfig`: receiving-device feedback preferences.
- `CustomizationAuditEvent`: hashed audit record for settings changes.

## Persistence

The settings migration creates tables for each configuration group plus `customization_audit_events`. The database stores text, boolean, and JSON settings, plus asset references. It does not store secrets or raw image binaries.

## API Routes

- `GET /api/settings/card-customization/[slug]`
- `POST /api/settings/card-customization/[slug]`
- `GET /api/settings/receptionist/[slug]`
- `POST /api/settings/receptionist/[slug]`
- `GET /api/settings/theme/[slug]`
- `POST /api/settings/theme/[slug]`
- `GET /api/settings/qr-feedback/[slug]`
- `POST /api/settings/qr-feedback/[slug]`

All write routes validate payloads and create audit events. Local development without `DATABASE_URL` returns a safe audit persistence status instead of exposing database details.
