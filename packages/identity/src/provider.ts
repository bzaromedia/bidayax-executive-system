import { createHmac } from "node:crypto";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload
} from "jose";
import type { IdentityEnvironment } from "./environment";
import {
  createPkcePair,
  randomUrlToken,
  safeEqual,
  sha256
} from "./crypto";

export type ProviderIdentity = {
  readonly provider: "workos";
  readonly providerSubject: string;
  readonly providerTenantId?: string | null;
  readonly providerSessionId?: string | null;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly displayName: string;
  readonly avatarUrl?: string | null;
  readonly authenticationMethod: string;
};

export type OAuthTransaction = {
  readonly transactionId: string;
  readonly stateHash: string;
  readonly nonceHash: string;
  readonly codeVerifier: string;
  readonly returnTo: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly consumedAt?: string | null;
};

export type LoginStart = {
  readonly authorizationUrl: string;
  readonly transaction: OAuthTransaction;
};

export type ProviderCallbackInput = {
  readonly code: string;
  readonly codeVerifier: string;
  readonly expectedNonceHash: string;
  readonly returnedNonce?: string | null;
  readonly ipAddress?: string | undefined;
  readonly userAgent?: string | undefined;
};

export type ProviderCallbackResult = {
  readonly identity: ProviderIdentity;
  readonly accessTokenClaims: JWTPayload;
};

export type VerifiedProviderWebhook = {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly data: unknown;
};

export class IdentityProviderError extends Error {
  readonly code:
    | "provider_exchange_failed"
    | "provider_token_invalid"
    | "provider_webhook_invalid"
    | "nonce_mismatch";

  constructor(code: IdentityProviderError["code"], message: string) {
    super(message);
    this.name = "IdentityProviderError";
    this.code = code;
  }
}

type WorkosAuthenticationResponse = {
  readonly access_token: string;
  readonly authentication_method?: string;
  readonly organization_id?: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly email_verified: boolean;
    readonly first_name?: string | null;
    readonly last_name?: string | null;
    readonly profile_picture_url?: string | null;
  };
};

export type IdentityProviderAdapter = {
  readonly provider: "workos";
  startLogin(input: { readonly returnTo: string; readonly now?: string }): LoginStart;
  completeCallback(input: ProviderCallbackInput): Promise<ProviderCallbackResult>;
  getLogoutUrl(input: {
    readonly providerSessionId: string;
    readonly returnTo: string;
  }): string;
  revokeProviderSession(providerSessionId: string): Promise<void>;
  verifyWebhook(input: {
    readonly payload: string;
    readonly signature: string;
    readonly now?: string;
  }): VerifiedProviderWebhook;
};

function displayName(user: WorkosAuthenticationResponse["user"]): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.email;
}

export function validateCallbackNonce(input: {
  readonly expectedNonceHash: string;
  readonly returnedNonce?: string | null;
}): void {
  if (input.returnedNonce && sha256(input.returnedNonce) !== input.expectedNonceHash) {
    throw new IdentityProviderError("nonce_mismatch", "Provider callback nonce did not match.");
  }
}

export async function verifyProviderAccessToken(
  token: string,
  key: CryptoKey | Uint8Array,
  input: {
    readonly audience: string;
    readonly issuer: string;
    readonly clockSkewSeconds: number;
    readonly algorithms?: readonly string[];
  }
): Promise<JWTPayload> {
  const verified = await jwtVerify(token, key, {
    algorithms: input.algorithms ? [...input.algorithms] : ["RS256"],
    audience: input.audience,
    clockTolerance: input.clockSkewSeconds,
    issuer: input.issuer
  });
  enforceVerifiedProviderClaims(verified.payload, input.clockSkewSeconds);
  return verified.payload;
}

function enforceVerifiedProviderClaims(
  claims: JWTPayload,
  clockSkewSeconds: number
): void {
  if (typeof claims.exp !== "number") {
    throw new IdentityProviderError(
      "provider_token_invalid",
      "Identity provider token expiration is required."
    );
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.iat === "number" && claims.iat > now + clockSkewSeconds) {
    throw new IdentityProviderError(
      "provider_token_invalid",
      "Identity provider token was issued too far in the future."
    );
  }
}

export function createWorkosProviderAdapter(
  environment: IdentityEnvironment,
  options: {
    readonly fetcher?: typeof globalThis.fetch;
    readonly verifyAccessToken?: (token: string) => Promise<JWTPayload>;
  } = {}
): IdentityProviderAdapter {
  const fetcher = options.fetcher ?? globalThis.fetch;
  const verifyAccessToken =
    options.verifyAccessToken ??
    (async (token: string) => {
      const jwks = createRemoteJWKSet(new URL(environment.workosJwksUrl));
      const verified = await jwtVerify(token, jwks, {
        algorithms: ["RS256"],
        audience: environment.allowedAudience,
        clockTolerance: environment.clockSkewSeconds,
        issuer: environment.workosIssuer
      });
      enforceVerifiedProviderClaims(verified.payload, environment.clockSkewSeconds);
      return verified.payload;
    });

  return {
    provider: "workos",

    startLogin({ returnTo, now = new Date().toISOString() }) {
      const transactionId = randomUrlToken();
      const state = randomUrlToken();
      const nonce = randomUrlToken();
      const pkce = createPkcePair();
      const createdAt = new Date(now);
      const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000).toISOString();
      const authorizationUrl = new URL("https://api.workos.com/user_management/authorize");
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("client_id", environment.workosClientId);
      authorizationUrl.searchParams.set("redirect_uri", environment.callbackUrl);
      authorizationUrl.searchParams.set("provider", "authkit");
      authorizationUrl.searchParams.set("state", state);
      authorizationUrl.searchParams.set("code_challenge_method", "S256");
      authorizationUrl.searchParams.set("code_challenge", pkce.challenge);

      return {
        authorizationUrl: authorizationUrl.toString(),
        transaction: {
          codeVerifier: pkce.verifier,
          createdAt: createdAt.toISOString(),
          expiresAt,
          nonceHash: sha256(nonce),
          returnTo,
          stateHash: sha256(state),
          transactionId
        }
      };
    },

    async completeCallback(input) {
      validateCallbackNonce(input);
      const response = await fetcher(
        "https://api.workos.com/user_management/authenticate",
        {
          body: JSON.stringify({
            client_id: environment.workosClientId,
            client_secret: environment.workosApiKey,
            code: input.code,
            code_verifier: input.codeVerifier,
            grant_type: "authorization_code",
            ...(input.ipAddress ? { ip_address: input.ipAddress } : {}),
            ...(input.userAgent ? { user_agent: input.userAgent } : {})
          }),
          headers: { "content-type": "application/json" },
          method: "POST"
        }
      );

      if (!response.ok) {
        throw new IdentityProviderError(
          "provider_exchange_failed",
          "Identity provider code exchange failed."
        );
      }

      const result = (await response.json()) as WorkosAuthenticationResponse;
      let claims: JWTPayload;
      try {
        claims = await verifyAccessToken(result.access_token);
      } catch {
        throw new IdentityProviderError(
          "provider_token_invalid",
          "Identity provider access token verification failed."
        );
      }

      if (claims.sub !== result.user.id) {
        throw new IdentityProviderError(
          "provider_token_invalid",
          "Identity provider subject did not match the verified token."
        );
      }

      return {
        accessTokenClaims: claims,
        identity: {
          authenticationMethod: result.authentication_method ?? "unknown",
          avatarUrl: result.user.profile_picture_url ?? null,
          displayName: displayName(result.user),
          email: result.user.email,
          emailVerified: result.user.email_verified,
          provider: "workos",
          providerSessionId:
            typeof claims.sid === "string" ? claims.sid : null,
          providerSubject: result.user.id,
          providerTenantId: result.organization_id ?? null
        }
      };
    },

    getLogoutUrl(input) {
      const url = new URL("https://api.workos.com/user_management/sessions/logout");
      url.searchParams.set("session_id", input.providerSessionId);
      url.searchParams.set("return_to", input.returnTo);
      return url.toString();
    },

    async revokeProviderSession(providerSessionId) {
      const response = await fetcher(
        "https://api.workos.com/user_management/sessions/revoke",
        {
          body: JSON.stringify({ session_id: providerSessionId }),
          headers: {
            authorization: `Bearer ${environment.workosApiKey}`,
            "content-type": "application/json"
          },
          method: "POST"
        }
      );
      if (!response.ok) {
        throw new IdentityProviderError(
          "provider_exchange_failed",
          "Provider session revocation failed."
        );
      }
    },

    verifyWebhook({ payload, signature, now = new Date().toISOString() }) {
      const parts = Object.fromEntries(
        signature.split(",").map((part) => {
          const [key, value = ""] = part.trim().split("=");
          return [key, value];
        })
      );
      const timestamp = parts.t;
      const provided = parts.v1;
      if (!timestamp || !provided) {
        throw new IdentityProviderError(
          "provider_webhook_invalid",
          "Provider webhook signature is malformed."
        );
      }

      const age = Math.abs(Date.parse(now) - Number(timestamp)) / 1000;
      if (!Number.isFinite(age) || age > 300) {
        throw new IdentityProviderError(
          "provider_webhook_invalid",
          "Provider webhook timestamp is outside the replay window."
        );
      }

      const expected = createHmac("sha256", environment.workosWebhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest("hex");
      if (!safeEqual(expected, provided)) {
        throw new IdentityProviderError(
          "provider_webhook_invalid",
          "Provider webhook signature is invalid."
        );
      }

      const parsed = JSON.parse(payload) as {
        readonly id?: string;
        readonly event?: string;
        readonly created_at?: string;
        readonly data?: unknown;
      };
      if (!parsed.id || !parsed.event || !parsed.created_at) {
        throw new IdentityProviderError(
          "provider_webhook_invalid",
          "Provider webhook payload is incomplete."
        );
      }

      return {
        data: parsed.data,
        eventId: parsed.id,
        eventType: parsed.event,
        occurredAt: parsed.created_at
      };
    }
  };
}
