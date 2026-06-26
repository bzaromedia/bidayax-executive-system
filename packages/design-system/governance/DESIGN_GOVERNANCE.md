# Design Governance

Phase 2 creates the governed frontend foundation only. It does not create application screens.

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
requirements -> tokens -> primitives -> components -> patterns -> layouts -> applications
```

No application surface can bypass this path.
