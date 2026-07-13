# Session Security

## Session Model

BidayaX application sessions are opaque. The browser receives only a random session token in an HttpOnly cookie. The database stores only `session_token_hash` and `csrf_token_hash`.

## Cookie Settings

- `bidayax_identity_session`: HttpOnly, SameSite=Lax, Secure in production.
- `bidayax_identity_csrf`: readable by the dashboard, SameSite=Lax, Secure in production.
- `bidayax_identity_transaction`: HttpOnly one-time login transaction cookie.

## Lifecycle

- Login creates a new application session after provider verification and internal membership resolution.
- Refresh rotates to a new session and revokes the previous session.
- Logout requires same-origin and double-submit CSRF evidence, revokes the session, clears cookies, and returns a provider logout URL when a provider session ID is available.
- Idle expiry and absolute expiry are enforced at session resolution.
- Disabled identities and revoked memberships deny session resolution.
- Membership or identity revocation triggers session revocation at the database layer.

## Protections

- Session fixation prevention through fresh session IDs/tokens on login and refresh.
- CSRF protection for unsafe identity actions.
- No provider tokens in browser-readable storage.
- Session hashes only in persistence.
- Production development fallback blocked.
