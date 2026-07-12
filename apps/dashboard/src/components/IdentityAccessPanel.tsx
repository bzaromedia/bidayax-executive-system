"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@bidayax/ui";

type IdentityAccessPanelProps = {
  readonly authenticated: boolean;
  readonly message: string;
  readonly returnTo: string;
  readonly role?: string | undefined;
};

function csrfCookie(): string | null {
  const prefix = "bidayax_identity_csrf=";
  const entry = document.cookie.split(";").map((part) => part.trim()).find(
    (part) => part.startsWith(prefix)
  );
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

export function IdentityAccessPanel({
  authenticated,
  message,
  returnTo,
  role
}: IdentityAccessPanelProps) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      const response = await globalThis.fetch("/api/auth/logout", {
        headers: {
          ...(csrfCookie() ? { "x-csrf-token": csrfCookie() as string } : {})
        },
        method: "POST"
      });
      const body = (await response.json()) as { providerLogoutUrl?: string };
      window.location.assign(body.providerLogoutUrl ?? "/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {authenticated ? "Authenticated settings session" : "Authentication required"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-content-secondary">{message}</p>
        {role ? (
          <p className="text-sm text-content-muted">Resolved role: {role}</p>
        ) : null}
        {authenticated ? (
          <Button disabled={busy} onClick={logout} type="button" variant="secondary">
            {busy ? "Signing out..." : "Sign out"}
          </Button>
        ) : (
          <Button asChild>
            <a href={"/auth/login?returnTo=" + encodeURIComponent(returnTo)}>
              Sign in
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
