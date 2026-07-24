import type { EnvironmentVariableDefinition } from "./types.ts";

export const canonicalApprovedSha = "1ff58dd466d755129f81bfa8c5fae5cd06d391cd";
export const liveKnownSha = "de7f5fa3cefb20123791c5a6e678674b0f881b84";
export const executiveCardComposeProject = "the-executive-card";
export const executiveCardBindings = {
  card: "127.0.0.1:3100:3000",
  dashboard: "127.0.0.1:3101:3001"
} as const;
export const executiveCardInternalNetworkKey = "executive_card_internal";
export const executiveCardInternalNetworkName = "the-executive-card-internal";
export const executiveCardVolumeName = "the_executive_card_postgres";
export const rollbackImageTags = {
  card: "the-executive-card-card:rollback-20260722",
  dashboard: "the-executive-card-dashboard:rollback-20260722"
} as const;
export const approvedRollbackImageIds = {
  card: "sha256:43501ebd11bc9d4354b14f23a5a5c7720ea1c16f78ed2decd24670274f1a63ea",
  dashboard: "sha256:72d69b76ccbc31e0b107821c18b3668210c7765623b96fb93a27e58410e93b85"
} as const;

export const canonicalEnvironmentDefinitions: EnvironmentVariableDefinition[] = [
  { name: "NODE_ENV", group: "URLS", required: true, expectedValue: "production" },
  { name: "DATABASE_URL", group: "POSTGRESQL", required: true, secret: true },
  { name: "DATABASE_SSL", group: "POSTGRESQL", required: true },
  { name: "PG_POOL_MAX", group: "POSTGRESQL", required: true },
  { name: "POSTGRES_DB", group: "POSTGRESQL", required: true },
  { name: "POSTGRES_USER", group: "POSTGRESQL", required: true },
  { name: "POSTGRES_PASSWORD", group: "POSTGRESQL", required: true, secret: true },
  { name: "APP_BASE_URL", group: "URLS", required: true },
  { name: "CARD_BASE_URL", group: "URLS", required: true },
  { name: "DASHBOARD_BASE_URL", group: "URLS", required: true },
  { name: "NEXT_PUBLIC_DASHBOARD_BASE_URL", group: "URLS", required: true },
  { name: "BIDAYAX_IP_HASH_SECRET", group: "COMMUNICATIONS", required: true, secret: true },
  { name: "WORKOS_CLIENT_ID", group: "WORKOS", required: true, secret: true },
  { name: "WORKOS_API_KEY", group: "WORKOS", required: true, secret: true },
  { name: "WORKOS_WEBHOOK_SECRET", group: "WORKOS", required: true, secret: true },
  { name: "WORKOS_REDIRECT_URI", group: "WORKOS", required: true },
  { name: "WORKOS_ISSUER", group: "WORKOS", required: true },
  { name: "WORKOS_JWKS_URL", group: "WORKOS", required: false },
  { name: "IDENTITY_TRANSACTION_ENCRYPTION_KEY", group: "IDENTITY", required: true, secret: true },
  { name: "IDENTITY_SECURE_COOKIES", group: "SESSION", required: true, expectedValue: true },
  { name: "IDENTITY_ALLOWED_REDIRECT_ORIGINS", group: "SESSION", required: true },
  { name: "IDENTITY_ALLOWED_AUDIENCE", group: "SESSION", required: false },
  { name: "IDENTITY_COOKIE_DOMAIN", group: "SESSION", required: false },
  { name: "IDENTITY_SESSION_IDLE_SECONDS", group: "SESSION", required: true },
  { name: "IDENTITY_SESSION_ABSOLUTE_SECONDS", group: "SESSION", required: true },
  { name: "IDENTITY_CLOCK_SKEW_SECONDS", group: "SESSION", required: true },
  { name: "TELEPHONY_PROVIDER", group: "TELEPHONY", required: true, expectedValue: "mock" },
  {
    name: "TELEPHONY_PROVIDER_MODE",
    group: "TELEPHONY",
    required: true,
    expectedValue: "disabled"
  },
  { name: "TWILIO_ACCOUNT_SID", group: "TELEPHONY", required: false, secret: true },
  { name: "TWILIO_AUTH_TOKEN", group: "TELEPHONY", required: false, secret: true },
  { name: "TWILIO_PHONE_NUMBER", group: "TELEPHONY", required: false },
  { name: "TWILIO_WEBHOOK_SIGNING_ENABLED", group: "TELEPHONY", required: false },
  { name: "TELEPHONY_SANDBOX_WEBHOOK_SECRET", group: "TELEPHONY", required: false, secret: true },
  {
    name: "VOICE_RUNTIME_PROVIDER",
    group: "VOICE",
    required: true,
    expectedValue: { oneOf: ["none", "disabled"] }
  },
  { name: "VOICE_AGENT_ENABLED", group: "VOICE", required: true, expectedValue: false },
  { name: "VOICE_TEST_MODE", group: "VOICE", required: true, expectedValue: true },
  { name: "LIVE_INBOUND_CALLS_ENABLED", group: "TELEPHONY", required: true, expectedValue: false },
  { name: "OUTBOUND_CALLS_ENABLED", group: "TELEPHONY", required: true, expectedValue: false },
  { name: "REQUIRE_HUMAN_APPROVAL", group: "TELEPHONY", required: true, expectedValue: true },
  { name: "HUMAN_APPROVAL_REQUIRED", group: "TELEPHONY", required: false, deprecated: true },
  { name: "ALLOW_PRODUCTION_CALLS", group: "TELEPHONY", required: true, expectedValue: false },
  { name: "VOICE_RECORDING_DISCLOSURE_ENABLED", group: "VOICE", required: true, expectedValue: false },
  { name: "CALL_TRANSFER_ENABLED", group: "TELEPHONY", required: true, expectedValue: false },
  { name: "OPENAI_API_KEY", group: "VOICE", required: false, secret: true },
  { name: "OPENAI_REALTIME_MODEL", group: "VOICE", required: false },
  { name: "DEEPGRAM_API_KEY", group: "VOICE", required: false, secret: true },
  { name: "ELEVENLABS_API_KEY", group: "VOICE", required: false, secret: true },
  { name: "EMAIL_HOST", group: "COMMUNICATIONS", required: false },
  { name: "EMAIL_USERNAME", group: "COMMUNICATIONS", required: false },
  { name: "EMAIL_PASSWORD", group: "COMMUNICATIONS", required: false, secret: true },
  { name: "WALLET_FEATURE_ENABLED", group: "WALLET_FUTURE", required: false, reservedForFuture: true },
  { name: "APPLE_WALLET_ENABLED", group: "WALLET_FUTURE", required: false, reservedForFuture: true },
  { name: "GOOGLE_WALLET_ENABLED", group: "WALLET_FUTURE", required: false, reservedForFuture: true },
  { name: "WALLET_PUBLIC_ISSUANCE_ENABLED", group: "WALLET_FUTURE", required: false, reservedForFuture: true },
  { name: "WALLET_DYNAMIC_UPDATES_ENABLED", group: "WALLET_FUTURE", required: false, reservedForFuture: true },
  { name: "WALLET_AUTO_UPDATE_ON_PUBLISH", group: "WALLET_FUTURE", required: false, reservedForFuture: true },
  { name: "WALLET_REVOCATION_ENABLED", group: "WALLET_FUTURE", required: false, reservedForFuture: true }
];
