# A.D Garner Executive Card Package

This package contains the isolated production card assets for A.D Garner.

## Contents

- `profile.json` contains this executive profile and card URL.
- `ad-garner.vcf` contains this executive contact card.
- `qr.png` is the QR asset for this executive card URL.
- `assets/avatar-placeholder.png` is the replaceable avatar asset.
- `assets/logo.png` and `assets/mark.png` are packaged brand assets.

## Public Card

https://theexecutivecard.online/card/ad-garner

## Safe Customization

Replace `assets/avatar-placeholder.png` with the approved executive avatar using the same file name. Do not edit application code for an avatar replacement.

Update production profile data only in `packages/config/executives/profiles.ts`, then regenerate this package with:

```powershell
pnpm cards:downloads
pnpm cards:downloads:verify
```

## Do Not Add

- secrets
- API keys
- passwords
- database URLs
- another executive profile
- shared mutable profile files

This package is environment-free and intended for internal operational distribution only.
