# Brand Configuration Model

The brand configuration model converts client branding into card-safe design tokens while preserving The Executive Card luxury structure.

## TenantBrandProfile

Fields:

- `tenantId`
- `companyName`
- `logoAssetId`
- `faviconAssetId`
- `primaryColor`
- `secondaryColor`
- `accentColor`
- `backgroundColor`
- `textColor`
- `fontFamily`
- `buttonRadius`
- `cardRadius`
- `motionIntensity`
- `contrastMode`
- `createdAt`
- `updatedAt`

## Brand Token Resolution Algorithm

Purpose: convert client branding inputs into safe design tokens without destroying The Executive Card visual language.

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

Client brand values are inputs, not raw CSS permissions. The resolver maps safe values into approved token slots. Unsafe contrast, unsupported color formats, missing logo references, or radius/motion values outside the approved set must produce warnings or blockers before publish.

## Asset Rules

Brand assets are referenced by `brand_assets.asset_id`. The database stores references and metadata only. It must not store raw large image binaries.
