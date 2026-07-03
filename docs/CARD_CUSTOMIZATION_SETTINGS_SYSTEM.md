# Card Customization Settings System

The Executive Card customization system separates the shared card template from customer-specific identity, brand, asset, action, calendar, receptionist, and QR feedback configuration.

## Active in v1.0

- Structured profile settings for each production executive card.
- Brand theme resolution with syntax and contrast validation.
- Avatar reference resolution with initials fallback.
- Action configuration for call, email, connect, website, download, and share surfaces.
- Calendar behavior configuration for routed meeting requests.
- Polyglot Receptionist settings for human-approved routing workflows.
- QR transfer feedback settings for haptics, sound, and animation preferences.
- Dashboard settings page at `/settings/card-customization`.
- Validated settings API routes with audit event creation.

## Configuration Flow

Executive Card Template
-> Customer Profile Config
-> Brand Theme Config
-> Avatar Asset Reference
-> Action Config
-> Receptionist Config
-> Calendar Config
-> QR Feedback Config
-> Rendered Executive Card

## Source Files

- `packages/types/src/card-customization.ts`
- `services/card-customization/src/`
- `database/migrations/0013_create_card_customization_settings.sql`
- `apps/dashboard/app/settings/card-customization/page.tsx`
- `apps/dashboard/app/api/settings/`
- `apps/card/src/components/ExecutiveCardTemplate.tsx`

## Production Rules

The card template remains consistent. Customer data changes through structured settings. Theme colors are accepted only through the resolver and validator. Image assets are stored as references, not raw database blobs. Settings changes create hashed audit events.
