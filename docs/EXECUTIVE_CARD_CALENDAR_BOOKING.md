# Executive Card Calendar Booking

Project: The Executive Card  
Owner: BidayaX LLC  
Status: implemented as an internal queued request workflow

## Purpose

The `Book a Meeting` card action routes to an internal calendar booking experience instead of opening a mail client.

Production route pattern:

```text
/card/[slug]/calendar
```

Implemented routes:

- `https://theexecutivecard.online/card/ad-garner/calendar`
- `https://theexecutivecard.online/card/naimah-barnes/calendar`
- `https://theexecutivecard.online/card/sean-hall/calendar`

## Data Source

Calendar availability comes from `packages/config/executives/profiles.ts`.

Each profile can define:

```ts
calendarSlots?: Array<{
  label: string;
  value: string;
  timezone: string;
}>;
```

If a profile does not define slots, the card app uses `executiveDefaultCalendarSlots` from the same config package.

## Current Provider Status

No live external calendar provider is claimed or required for v1.0.

The route uses an internal availability selector and submits a `schedule_meeting` request through the existing receptionist request API. When email or external calendar providers are not configured, the UI treats the result as an internal queued request for executive follow-up.

## Event Logging

The calendar flow emits:

- `calendar_view`
- `calendar_slot_selected`
- `calendar_request_submitted`
- `calendar_request_failed`

The database enum is extended by `database/migrations/0011_add_calendar_interaction_events.sql`.

## Future Integration Path

Future integrations may connect Calendly, Google Calendar, or Microsoft 365 after provider credentials, owner approvals, privacy review, and operational monitoring are in place.

Until then:

- no external calendar booking is claimed;
- no calendar invite is automatically created;
- no mail client opens as a meeting fallback;
- no provider logo or unsupported integration claim appears in the card UI.

## Validation

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrations:verify
```

Owner device validation should confirm the `Schedule now` link opens `/card/[slug]/calendar`, the slot selector works, and submission shows a queued confirmation state.
