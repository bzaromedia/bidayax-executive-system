# Executive Card Splash Screen

Project: The Executive Card  
Owner: BidayaX LLC  
Status: implemented for production card presentation

## Purpose

The Executive Card logo mark is reserved for the loading transition before an executive card appears. The production card itself intentionally focuses on the executive identity and does not display a persistent logo in the header, card body, QR sheet, or footer actions.

## Runtime Behavior

- Component: `apps/card/src/components/ExecutiveCardSplash.tsx`
- Styling: `apps/card/src/styles/card.css`
- Duration: 760ms for standard motion, 140ms for reduced-motion users.
- Accessibility: the splash uses `role="status"` and respects `prefers-reduced-motion`.
- Scope: the splash appears when the card template first mounts and does not reappear during simple card interactions.

## Design Rules

- Full-screen black-on-black background.
- Centered approved logo mark only.
- No wordmark in the visible UI.
- No heavy animation, video, GSAP timeline, or provider dependency.
- Gold remains limited to the logo mark and approved accent surfaces.

## Validation

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify:design-governance
```

Card tests verify that the main card header and template do not include the persistent logo mark and that the splash component contains the logo mark.
