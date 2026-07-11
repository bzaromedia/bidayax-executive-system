# Asset Management

Phase 4 adds asset reference validation without implementing arbitrary uploads.

## Supported References

Brand assets are references only. Raw image bytes are not stored in settings records.

Allowed MIME types:

- `image/png`
- `image/jpeg`
- `image/svg+xml`
- `image/webp`

Allowed storage references:

- managed local launch paths beginning with `/uploads/`
- future CDN URLs beginning with `https://`

## Tenant Ownership

Asset references must match the requesting tenant. Cross-tenant logo, favicon, or profile image references are rejected by `validateBrandAssetReference`.

## Required Metadata

Each asset reference needs:

- asset ID
- tenant ID
- asset type
- storage path
- alt text
- MIME type
- checksum reference
- created timestamp

## Future Work

Secure upload handling, virus scanning, resizing, CDN storage, and image moderation remain future implementation steps.
