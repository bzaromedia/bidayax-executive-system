import { NextResponse } from "next/server";
import {
  applicationSessionCookieName,
  clearIdentityCookie,
  createWorkosProviderAdapter,
  identityCsrfCookieName,
  identityTransactionCookieName,
  isAllowedReturnTo,
  parseCookie,
  serializeIdentityCookie,
  startIdentityLogin,
  completeIdentityLogin,
  processIdentityWebhook,
  revokeApplicationSession,
  rotateApplicationSession,
  verifyCsrf
} from "@bidayax/identity";
import {
  getIdentityEnvironment,
  resolveRequestApplicationSession,
  withIdentityTransaction
} from "./identity-runtime";

function requestIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

export function identityConfigurationError() {
  return NextResponse.json(
    {
      error: {
        code: "identity_unavailable",
        message: "Production identity configuration is unavailable."
      }
    },
    { status: 503 }
  );
}

export function sameOrigin(request: Request): boolean {
  const environment = getIdentityEnvironment();
  if (!environment) return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return environment.allowedRedirectOrigins.includes(origin);
}

export async function startLoginResponse(request: Request) {
  const environment = getIdentityEnvironment();
  if (!environment) return identityConfigurationError();
  const requestedReturnTo = new URL(request.url).searchParams.get("returnTo");
  const returnTo = isAllowedReturnTo(requestedReturnTo, environment)
    ? new URL(requestedReturnTo as string, environment.applicationBaseUrl).toString()
    : new URL("/settings/card-customization", environment.applicationBaseUrl).toString();
  const provider = createWorkosProviderAdapter(environment);
  const started = await withIdentityTransaction((repository) =>
    startIdentityLogin({ environment, provider, repository, returnTo })
  );
  const response = NextResponse.redirect(started.authorizationUrl);
  response.headers.append(
    "set-cookie",
    serializeIdentityCookie({
      domain: environment.cookieDomain,
      httpOnly: true,
      maxAge: 600,
      name: identityTransactionCookieName,
      secure: environment.cookieSecure,
      value: started.transactionToken
    })
  );
  response.headers.set("cache-control", "no-store");
  return response;
}

export async function callbackResponse(request: Request) {
  const environment = getIdentityEnvironment();
  if (!environment) return identityConfigurationError();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const transactionToken = parseCookie(
    request.headers.get("cookie"),
    identityTransactionCookieName
  );
  if (!code || !state || !transactionToken) {
    return NextResponse.redirect(
      new URL("/settings/card-customization?auth=failed", environment.applicationBaseUrl)
    );
  }

  try {
    const provider = createWorkosProviderAdapter(environment);
    const completed = await withIdentityTransaction((repository) =>
      completeIdentityLogin({
        code,
        environment,
        ipAddress: requestIp(request),
        provider,
        repository,
        state,
        transactionToken,
        userAgent: request.headers.get("user-agent") ?? undefined
      })
    );
    const response = NextResponse.redirect(completed.returnTo);
    const maxAge = Math.max(
      0,
      Math.floor(
        (Date.parse(completed.issued.session.absoluteExpiresAt) - Date.now()) / 1000
      )
    );
    response.headers.append(
      "set-cookie",
      serializeIdentityCookie({
        domain: environment.cookieDomain,
        httpOnly: true,
        maxAge,
        name: applicationSessionCookieName,
        secure: environment.cookieSecure,
        value: completed.issued.sessionToken
      })
    );
    response.headers.append(
      "set-cookie",
      serializeIdentityCookie({
        domain: environment.cookieDomain,
        httpOnly: false,
        maxAge,
        name: identityCsrfCookieName,
        secure: environment.cookieSecure,
        value: completed.issued.csrfToken
      })
    );
    response.headers.append(
      "set-cookie",
      clearIdentityCookie({
        domain: environment.cookieDomain,
        httpOnly: true,
        name: identityTransactionCookieName,
        secure: environment.cookieSecure
      })
    );
    response.headers.set("cache-control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/settings/card-customization?auth=failed", environment.applicationBaseUrl)
    );
  }
}

export async function sessionResponse(request: Request) {
  const resolution = await resolveRequestApplicationSession(request);
  if (!resolution.ok) {
    return NextResponse.json(
      { authenticated: false, reason: resolution.reason },
      { status: resolution.status, headers: { "cache-control": "no-store" } }
    );
  }
  return NextResponse.json(
    {
      authenticated: true,
      session: {
        expiresAt: resolution.context.expiresAt,
        provider: resolution.context.provider,
        role: resolution.context.role,
        tenantId: resolution.context.tenantId,
        userId: resolution.context.userId
      }
    },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function refreshSessionResponse(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: { code: "csrf_failed" } }, { status: 403 });
  }
  const resolution = await resolveRequestApplicationSession(request);
  if (!resolution.ok) {
    return NextResponse.json(
      { error: { code: "unauthenticated", message: resolution.reason } },
      { status: resolution.status }
    );
  }
  const csrfCookie = parseCookie(request.headers.get("cookie"), identityCsrfCookieName);
  const csrfValid = await verifyCsrf({
    csrfCookie,
    csrfHeader: request.headers.get("x-csrf-token"),
    repository: resolution.repository,
    sessionId: resolution.session.sessionId
  });
  if (!csrfValid) {
    return NextResponse.json({ error: { code: "csrf_failed" } }, { status: 403 });
  }
  const issued = await withIdentityTransaction((repository) =>
    rotateApplicationSession({
      environment: resolution.environment,
      repository,
      session: resolution.session
    })
  );
  const maxAge = Math.floor(
    (Date.parse(issued.session.absoluteExpiresAt) - Date.now()) / 1000
  );
  const response = NextResponse.json({ refreshed: true });
  response.headers.append(
    "set-cookie",
    serializeIdentityCookie({
      domain: resolution.environment.cookieDomain,
      httpOnly: true,
      maxAge,
      name: applicationSessionCookieName,
      secure: resolution.environment.cookieSecure,
      value: issued.sessionToken
    })
  );
  response.headers.append(
    "set-cookie",
    serializeIdentityCookie({
      domain: resolution.environment.cookieDomain,
      httpOnly: false,
      maxAge,
      name: identityCsrfCookieName,
      secure: resolution.environment.cookieSecure,
      value: issued.csrfToken
    })
  );
  response.headers.set("cache-control", "no-store");
  return response;
}

export async function logoutResponse(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: { code: "csrf_failed" } }, { status: 403 });
  }
  const resolution = await resolveRequestApplicationSession(request);
  if (!resolution.ok) {
    return NextResponse.json({ loggedOut: true });
  }
  const csrfCookie = parseCookie(request.headers.get("cookie"), identityCsrfCookieName);
  const csrfValid = await verifyCsrf({
    csrfCookie,
    csrfHeader: request.headers.get("x-csrf-token"),
    repository: resolution.repository,
    sessionId: resolution.session.sessionId
  });
  if (!csrfValid) {
    return NextResponse.json({ error: { code: "csrf_failed" } }, { status: 403 });
  }
  await withIdentityTransaction((repository) =>
    revokeApplicationSession({
      repository,
      sessionId: resolution.session.sessionId,
      tenantId: resolution.session.tenantId,
      userId: resolution.session.userId
    })
  );
  const response = NextResponse.json({
    loggedOut: true,
    providerLogoutUrl: resolution.session.providerSessionId
      ? createWorkosProviderAdapter(resolution.environment).getLogoutUrl({
          providerSessionId: resolution.session.providerSessionId,
          returnTo: resolution.environment.applicationBaseUrl
        })
      : resolution.environment.applicationBaseUrl
  });
  response.headers.append(
    "set-cookie",
    clearIdentityCookie({
      domain: resolution.environment.cookieDomain,
      httpOnly: true,
      name: applicationSessionCookieName,
      secure: resolution.environment.cookieSecure
    })
  );
  response.headers.append(
    "set-cookie",
    clearIdentityCookie({
      domain: resolution.environment.cookieDomain,
      httpOnly: false,
      name: identityCsrfCookieName,
      secure: resolution.environment.cookieSecure
    })
  );
  response.headers.set("cache-control", "no-store");
  return response;
}

export async function webhookResponse(request: Request) {
  const environment = getIdentityEnvironment();
  if (!environment) return identityConfigurationError();
  const signature = request.headers.get("workos-signature");
  if (!signature) {
    return NextResponse.json({ error: { code: "invalid_signature" } }, { status: 401 });
  }
  const payload = await request.text();
  try {
    const result = await withIdentityTransaction((repository) =>
      processIdentityWebhook({
        payload,
        provider: createWorkosProviderAdapter(environment),
        repository,
        signature
      })
    );
    return NextResponse.json({ accepted: true, duplicate: result.duplicate });
  } catch {
    return NextResponse.json({ error: { code: "invalid_webhook" } }, { status: 401 });
  }
}
