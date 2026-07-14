# Retention Policy

## Purpose

Retention policy keeps the voice runtime from storing more conversational data than the current phase supports.

## Current Defaults

- Transcript preview retention: 30 days.
- Audit event retention: 365 days.
- Recording retention: 0 days.
- Raw audio retention: disabled.

## Phase 9 Rules

Raw audio retention is blocked. Recording retention is metadata-only unless a later phase adds consent, storage, deletion, and audit controls.

## Future Work

A later persistence phase must add durable retention schedules, deletion workers, export controls, tenant policy overrides, and evidence that retention jobs ran.
