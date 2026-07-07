# Branding Model

Branding configuration converts client-specific identity into approved Executive
Card design tokens. Client branding may influence approved token slots, but it
must not bypass the design system or create raw presentation styles in UI code.

## Tables

### tenant_brand_profiles

Client brand input before design-token resolution.

Columns:
- `brand_profile_id uuid primary key`
- `tenant_id uuid not null references tenants(tenant_id)`
- `company_name text not null`
- `logo_asset_id uuid references brand_assets(asset_id)`
- `favicon_asset_id uuid references brand_assets(asset_id)`
- `primary_color text not null`
- `secondary_color text not null`
- `accent_color text not null`
- `background_color text not null`
- `text_color text not null`
- `font_family text not null`
- `button_radius text not null`
- `card_radius text not null`
- `motion_intensity text not null`
- `contrast_mode text not null`
- `resolved_token_snapshot jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:
- `tenant_brand_profiles_tenant_id_idx` on `tenant_id`
- Unique partial index on `(tenant_id)` for the active profile if an
  `active` flag is added in Phase 2B.

Constraints:
- Colors must normalize to a supported color format before preview or publish.
- `font_family` must map to approved display/body font tokens.
- `button_radius` and `card_radius` must map to approved radius tokens.
- `motion_intensity` must be `none`, `reduced`, `standard`, or `expressive`.
- `contrast_mode` must be `standard`, `high_contrast`, or `soft_luxury`.

### brand_assets

References to brand and profile assets. The database stores references only,
not raw large binary assets.

Columns:
- `asset_id uuid primary key`
- `tenant_id uuid not null references tenants(tenant_id)`
- `asset_type text not null`
- `storage_path text not null`
- `alt_text text not null`
- `mime_type text not null`
- `checksum_sha256 text not null`
- `status text not null default 'pending_review'`
- `created_at timestamptz not null default now()`

Indexes:
- `brand_assets_tenant_id_idx` on `tenant_id`
- `brand_assets_asset_type_idx` on `asset_type`
- `brand_assets_checksum_sha256_idx` on `checksum_sha256`

Constraints:
- `asset_type` is one of `logo`, `favicon`, `profile_image`, or `card_media`.
- `mime_type` must be an approved image format.
- Assets must pass validation before publish.
- Broken or unapproved assets fall back to safe defaults.

## Brand Token Resolution Algorithm

Purpose: convert client branding inputs into safe design tokens without
destroying The Executive Card luxury design language.

Steps:
1. Read tenant brand profile.
2. Validate required brand values.
3. Normalize colors into supported formats.
4. Check contrast ratio.
5. Generate fallback colors if unsafe.
6. Map client colors into approved token slots.
7. Preserve BidayaX structural design language.
8. Produce card-safe tokens.
9. Store resolved token snapshot.
10. Use snapshot for preview and publish.

## Design Governance

- Settings do not directly mutate UI components.
- UI consumes resolved token snapshots only.
- Client colors may not be injected into JSX as raw style values.
- The default Executive Card black/gold identity remains the fallback.
- Gold remains an approved accent, not an uncontrolled background color.
- Unsafe contrast blocks publish and produces a preview warning.

## Relationships

- One tenant owns many brand assets.
- One tenant owns one active brand profile at publish time.
- One brand profile resolves into one publishable token snapshot.
- Published card versions embed the resolved token snapshot used at publish time.
