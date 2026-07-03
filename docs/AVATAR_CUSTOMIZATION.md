# Avatar Customization

The avatar resolver selects the safest profile image source for each executive card.

## Active in v1.0

- Avatar URL references in structured card settings.
- Validation status for avatar references.
- Initials fallback when an avatar is missing or invalid.
- Local production-safe asset directories:
  - `apps/card/public/uploads/avatars/`
  - `apps/card/public/uploads/logos/`

## How To Set An Avatar

1. Add an approved image file under `apps/card/public/uploads/avatars/`.
2. Set the executive avatar URL to the matching public path.
3. Mark the avatar validation status as `valid` only after the image is checked.
4. Regenerate card downloads when downloadable packages need the new asset.

## Safety Notes

The v1.0 implementation stores references only. It does not store raw large images in the database. Arbitrary browser uploads are not enabled in the production card release.
