# Production Executive Cards

Project: The Executive Card  
Owner: BidayaX LLC  
Public URL: https://theexecutivecard.online

## Scope

Recovery Phase B1 adds three real executive cards for internal business use:

| Executive | Role | URL |
| --- | --- | --- |
| A.D Garner | COO / CTO / Founder | https://theexecutivecard.online/card/ad-garner |
| Naimah J. Barnes | CEO | https://theexecutivecard.online/card/naimah-barnes |
| Sean Hall | Executive Management | https://theexecutivecard.online/card/sean-hall |

Sean Hall may later be represented in public marketing, but all three cards are currently operational business cards, not customer proof or public sales claims.

## Production Data Source

Profile data lives in `packages/config/executives/profiles.ts`.

Shared production values:

- Company: BidayaX LLC
- Address line 1: 8 The Green Ste A
- Address line 2: Dover, DE 19901
- Phone: +1 (302) 330-5547
- Email: contact@theexecutivecard.com
- Website action: https://bidayax.com
- Public card base URL: https://theexecutivecard.online
- Visible tagline: Building category-defining Synthetic Intelligence for global enterprises
- Theme: executive-black-gold

`contact@theexecutivecard.com` must be configured in production DNS/mail before public operational use.

## Card Capabilities

Each card includes:

- public profile route;
- unique slug;
- in-page QR code;
- direct QR image route;
- vCard download route;
- call button;
- email button;
- website button;
- internal calendar booking route;
- address display;
- share button;
- contact-save action;
- per-executive download card action;
- fixed bottom action bar for QR, Download, and Share;
- polyglot receptionist request workflow with consent;
- splash screen that reserves the logo mark for loading and removes persistent logos from the main card;
- card view, QR scan, QR transfer feedback, call, email, website, vCard, share, and calendar event logging;
- SEO metadata;
- OpenGraph metadata;
- responsive mobile and desktop layout.

## Event Ledger

The card app emits these events:

- `card_view`
- `qr_scan`
- `call_click`
- `email_click`
- `website_click`
- `vcard_download`
- `share_click`
- `qr_transfer_detected`
- `qr_transfer_success_feedback`
- `qr_transfer_failure_feedback`
- `qr_transfer_haptics_toggled`
- `qr_transfer_sound_toggled`
- `qr_transfer_animation_toggled`
- `calendar_view`
- `calendar_slot_selected`
- `calendar_request_submitted`
- `calendar_request_failed`
- `receptionist_request_started`
- `receptionist_request_submitted`
- `receptionist_request_failed`
- `receptionist_meeting_requested`
- `receptionist_callback_requested`
- `receptionist_lead_qualified`

The database migration `0009_add_share_click_interaction_event.sql` extends the interaction event enum for share tracking.
The database migration `0010_add_receptionist_request_events.sql` extends the interaction event enum for receptionist request workflow tracking.
The database migration `0011_add_calendar_interaction_events.sql` extends the interaction event enum for internal calendar booking tracking.
The database migration `0012_add_qr_transfer_feedback_events.sql` extends the interaction event enum for receiver-side QR transfer feedback tracking.

## QR Transfer Feedback

Production QR URLs use `?source=qr`. When a receiving device opens a QR-marked card URL, the card shows a temporary `Executive Card received` confirmation with a `Save Contact` action.

The v1.0 feedback scope is receiver device only. Haptics depend on `navigator.vibrate()` support, sound is off by default and uses Web Audio generated tones, and animation respects reduced-motion settings. Sender-side feedback requires an active paired web session or native bridge and is not claimed as active in v1.0.

## Calendar Booking

`Schedule now` routes to `/card/[slug]/calendar`. The route uses profile-configured internal availability slots and submits a safe `schedule_meeting` request through the receptionist request API.

No live external calendar provider is claimed in v1.0. If a provider is not configured, successful submissions are treated as internal queued requests for executive follow-up.

## Mobile UX Rules

The production card layout uses a fixed safe-area-aware bottom action bar for QR, Download, and Share. Page content includes enough bottom padding to keep final content visible above the bar without adding excessive empty space.

The Executive Receptionist is intentionally launcher-first on the main card. The full form opens in a compact modal/bottom sheet with the close control and submit button reachable on mobile. Scrollbars are visually hidden while scrolling remains available if the sheet overflows.

All card, modal, calendar, QR, and bottom-action surfaces must preserve `width: 100%`, `max-width: 100%`, border-box sizing, and horizontal overflow guards so long emails, URLs, buttons, and form controls do not drift outside the viewport.

## Brand Assets

Production brand mark SVGs are stored in:

- `apps/card/public/brand/`
- `apps/dashboard/public/brand/`
- `packages/design-system/branding/`

The runtime card UI uses design-system tokens and the approved black/gold identity. The logo mark appears in the splash/loading transition only; the main executive card page intentionally removes persistent logo placement so the executive identity remains the focus.

## Verification

Run:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrations:verify
```

Card-specific tests live in `apps/card/src/__tests__/production-cards.test.ts`.

## Customization Settings Foundation

The production cards now render through the shared Executive Card template plus structured customer settings generated from `packages/config/executives/profiles.ts`.

Active settings groups:

- profile identity and contact values;
- avatar reference with initials fallback;
- approved brand theme resolution;
- card action visibility;
- internal calendar behavior;
- receptionist routing behavior;
- QR transfer feedback preferences.

The customization service lives in `services/card-customization/`, and shared types live in `packages/types/src/card-customization.ts`. The database migration `0013_create_card_customization_settings.sql` adds settings tables and audit events for production persistence.

The current three production cards keep their existing URLs and actions. Customer-specific assets should be referenced through approved local paths under `apps/card/public/uploads/avatars/` and `apps/card/public/uploads/logos/` for the launch configuration.
