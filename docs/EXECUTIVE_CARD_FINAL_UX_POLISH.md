# Executive Card Final UX Polish

This pass finalizes the production card UX without changing card identity, QR, vCard, download, calendar, dashboard, deployment, or event logging routes.

## Fixed Bottom Navigation

The bottom action dock is fixed to the viewport, safe-area aware, and limited to QR, Download, and Share actions. Content receives footer clearance so the dock does not overlap the Polyglot Receptionist panel or the final card content.

## Receptionist Interaction

The card surface shows a compact Polyglot Receptionist entry point. The request form opens in a compact modal sheet rather than rendering as a static inline form. The sheet uses hidden scrollbars when overflow is required and preserves mobile scrolling.

## Splash Timing

The logo splash uses the brand mark and is configured for 460ms by default and 300ms for reduced-motion users. It does not trap the page and the main card remains server-rendered.

## Visual Rules

- No gold page background gradients.
- Gold is reserved for brand mark, action highlights, and accents.
- Black-on-black surface depth is used for the page background.
- Lighter charcoal cards provide hierarchy.
- Visible scrollbars are hidden while scroll behavior remains available.
- Horizontal overflow guards remain active across card surfaces.
