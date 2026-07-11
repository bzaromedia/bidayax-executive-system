# Brand Token Resolver

Phase 2B implements the token-layer logic behind the documented Brand Token
Resolution Algorithm for the Executive Card Modularity & Settings Layer.

This phase does not build settings UI, create migrations, or apply customer
styles directly inside applications. It creates a resolver that converts tenant
brand input into a safe, immutable, design-governed token snapshot.

## Package Location

Implementation files:

- `packages/tokens/src/color-utils.ts`
- `packages/tokens/src/brand-token-validation.ts`
- `packages/tokens/src/brand-token-resolver.ts`
- `packages/types/src/resolved-brand-tokens.ts`

Tests:

- `packages/tokens/src/__tests__/brand-token-validation.test.ts`
- `packages/tokens/src/__tests__/brand-token-resolver.test.ts`

## Resolver Input

The resolver accepts `TenantBrandProfile` from `@bidayax/types`.

Required tenant brand inputs include:

- tenant identity
- company name
- logo and favicon asset references
- primary, secondary, accent, background, and text colors
- font preference
- button and card radius preferences
- motion intensity
- contrast mode

## Resolver Output

The resolver returns `ResolvedBrandTokens`:

- `tenantId`
- `sourceBrandProfileId`
- `colors`
- `typography`
- `radius`
- `motion`
- `accessibility`
- `warnings[]`
- `resolverVersion`
- `snapshotHash`
- `createdAt`

The snapshot hash is deterministic for the resolved token content and excludes
`createdAt`, allowing settings versions to detect whether the resolved design
payload changed independently from publication time.

## Brand Token Resolution Algorithm

1. Accept `TenantBrandProfile`.
2. Validate required values.
3. Normalize HEX, RGB, and HSL input into canonical uppercase HEX.
4. Validate WCAG contrast for text/background and action/text pairs.
5. If unsafe, generate approved Executive Card fallback values.
6. Map client colors into approved BidayaX token slots.
7. Preserve Executive Card structure, spacing, radius, typography, and motion
   governance.
8. Return `ResolvedBrandTokens`.
9. Include validation warnings.
10. Include deterministic hash/version signature for snapshot tracking.

## Validation Behavior

Validation is intentionally conservative:

- Missing required values produce errors.
- Invalid colors produce errors and fall back internally for safe resolution.
- Unsafe contrast produces warnings and fallback values.
- Arbitrary radius values do not pass through to UI; they map back to approved
  radius tokens.
- Unsupported motion intensity falls back to `standard`.
- Unsupported contrast mode falls back to `standard`.

## Approved Fallbacks

The fallback palette preserves The Executive Card visual identity:

- background: `#111111`
- surface: `#1A1A1A`
- accent/action/focus: `#D4AF37`
- text: `#F5F5F5`
- muted text: existing muted semantic token

## Design Governance Boundary

The resolver does not generate CSS classes, inline styles, JSX, or app-level UI.
It only returns token snapshots that future settings UI and card rendering can
consume. This preserves the rule that customer customization must go through
`packages/tokens`, `packages/design-system`, and `packages/ui` instead of raw
styling inside apps.

## Phase 2C Handoff

Phase 2C should connect settings UI and the top-right card settings icon to this
resolver through preview-only workflows. It should not let unvalidated raw
customer values reach the production card presentation layer.
### Authorized Token Package Change

Phase 2B intentionally modifies `packages/tokens` because the Brand Token Resolver is part of the token source of truth. The approved path is:

1. brand inputs are validated in `packages/tokens/src/brand-token-validation.ts`;
2. colors are normalized and checked in `packages/tokens/src/color-utils.ts`;
3. safe resolved tokens are emitted from `packages/tokens/src/brand-token-resolver.ts`;
4. apps consume resolved tokens through package exports instead of app-local styling.

This is the only approved override for the locked token package in this PR. New app-level colors, spacing, radii, typography, or motion values remain prohibited outside `packages/tokens`, `packages/design-system`, and `packages/ui`.
