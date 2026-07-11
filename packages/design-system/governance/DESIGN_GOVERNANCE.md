# Design Governance

Phase 2 creates the governed The Executive Card frontend foundation only. It does not create application screens.

## Rules

1. No new colors outside `packages/tokens`.
2. No new spacing outside `packages/tokens`.
3. No new typography outside `packages/tokens`.
4. No new motion outside `packages/tokens`.
5. No new shadows outside elevation tokens.
6. No new components without design-system approval.
7. Application screens must be assembled from approved primitives.
8. Storybook must document every reusable component.
9. Accessibility is mandatory.
10. Performance is a design requirement.
11. No trust interface may bypass the design-system supply chain.
12. No enterprise data-room view may bypass the design-system supply chain.
13. No application may introduce raw colors, raw spacing, raw typography, raw motion, raw shadows, unapproved components, or unapproved icons.

## Review Questions

Every token group and component must answer:

- Why does this exist?
- What future interface will use it?
- What problem does it prevent?
- What measurable advantage does it create?
- How does it reduce design drift?
- How does it support future business cards, dashboards, and receptionist screens?

## Approval Path

Visual decisions flow through:

```text
Single Source of Truth
-> Design Tokens
-> Primitive Components
-> Composite Components
-> Patterns
-> Layouts
-> Templates
-> Applications
-> Trust Interfaces
-> Enterprise Data Room
```

No application surface can bypass this path.
## Token Package Change Approval

`packages/tokens` is the approved source of truth for token definitions and token-resolution algorithms. Changes to this package are allowed only when they are:

1. documented in the relevant token-system documentation;
2. covered by token or design-governance tests;
3. consumed by apps through package exports rather than app-local hardcoded values.

The Phase 2 Brand Token Resolver follows this approval path so client brand inputs can be normalized into safe BidayaX token slots without bypassing design governance.
