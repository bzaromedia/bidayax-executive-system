# Authentication Architecture

## Layers

1. Provider adapter: starts WorkOS login, exchanges callback codes, verifies provider tokens, verifies webhooks, and creates provider logout URLs.
2. Internal identity: stores the minimal user/provider account mapping needed for authorization and audit.
3. Application session: issues an opaque BidayaX session cookie after provider identity and internal membership are verified.
4. Settings authorization: derives trusted settings context from server-side session resolution, tenant membership, card grants, and role policy.

## Provider Callback Security

The callback flow validates:

- state hash
- one-time OAuth transaction token
- PKCE verifier
- transaction expiry
- provider token issuer
- provider token audience
- provider token signature
- expiration and not-before timestamps
- allowed clock skew
- subject consistency between verified token and provider user payload
- verified email requirement

Nonce storage exists in the transaction model. WorkOS AuthKit authorization-code exchange does not currently return a nonce value through this adapter path, so nonce validation is enforced when a returned nonce is provided and otherwise documented as not applicable for this exchange.

## Fail-Closed Behavior

Production routes do not issue development identities. If mandatory WorkOS or session environment configuration is missing, dashboard identity routes return an identity-unavailable response and settings APIs deny access.

## Browser Storage Rules

- Application session token: HttpOnly cookie only.
- CSRF token: non-HttpOnly SameSite cookie paired with `x-csrf-token` header for unsafe requests.
- Provider access tokens: not stored in browser-readable storage.
- LocalStorage: not used for authentication.
