# Polyglot Receptionist Workflow

The Polyglot Receptionist workflow package runs deterministic receptionist intake, safety, routing, callback, calendar, and notification preparation logic for The Executive Card.

The package does not place live calls, send email, or write calendar events by itself. Provider dispatch is controlled by environment configuration in the application layer. When providers are not configured, workflow runs still create queued internal request payloads for dashboard-visible human follow-up.
