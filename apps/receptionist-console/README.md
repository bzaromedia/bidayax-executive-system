# Receptionist Console

The active v1.0 receptionist console lives inside the dashboard application at:

```text
apps/dashboard/app/receptionist/page.tsx
```

That route shows the receptionist request queue, language and intent breakdowns, follow-up tasks, provider status, voice trust score, urgency, callback/meeting state, and audit timeline.

This folder is retained as a boundary marker for a future standalone console application. Do not treat it as an active runtime app in v1.0, and do not add workspace scripts that depend on this folder until a standalone console is intentionally implemented.
