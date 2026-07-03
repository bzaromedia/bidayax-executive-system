# Brand Theme Customization

The Brand Theme Resolver validates customer theme settings before applying them to The Executive Card template.

## Active in v1.0

- Theme configuration fields for brand name, logo references, colors, and fonts.
- Resolver fallback to the approved `executive-black-gold` theme when a customer theme is invalid or not approved.
- Color syntax validation for approved design tokens, RGB values, and valid hex input.
- Text/background contrast validation when concrete RGB or hex values are provided.

## Safety Rules

- Customer colors may override approved theme aliases only.
- Raw styling should not be placed in JSX.
- Unreadable contrast is rejected.
- Unapproved themes fall back to the production Executive Card theme.

## Operational Notes

Brand images are referenced by URL or local asset path. The production launch path uses local asset references under the card app public directory. External asset storage can be connected after storage policy, moderation, and access controls are defined.
