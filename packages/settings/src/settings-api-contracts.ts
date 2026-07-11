import type {
  CardSettingsVersion,
  CustomerCardSettings,
  SettingsAuditEvent,
  SettingsPublishResult
} from "@bidayax/types";
import type { SettingsAuthorizationDecision } from "./settings-authorization";

export const settingsApiActions = [
  "read",
  "save_draft",
  "preview",
  "publish",
  "history",
  "asset_reference"
] as const;

export type SettingsApiAction = (typeof settingsApiActions)[number];

export type SettingsApiErrorCode =
  | "authorization_failed"
  | "conflict"
  | "database_unconfigured"
  | "invalid_payload"
  | "not_found"
  | "persistence_failed";

export type SettingsApiError = {
  readonly code: SettingsApiErrorCode;
  readonly message: string;
  readonly requestId: string;
};

export type SettingsApiSuccess<TData> = {
  readonly audit?: {
    readonly events?: readonly SettingsAuditEvent[];
    readonly persisted?: boolean;
  };
  readonly authorization?: Pick<SettingsAuthorizationDecision, "allowed" | "permission" | "reason">;
  readonly cache?: {
    readonly hit: boolean;
    readonly key: string;
  };
  readonly data: TData;
  readonly ok: true;
  readonly requestId: string;
};

export type SettingsApiFailure = {
  readonly error: SettingsApiError;
  readonly ok: false;
};

export type SettingsApiResponse<TData> = SettingsApiSuccess<TData> | SettingsApiFailure;

export type SettingsWorkspaceData = {
  readonly cardId: string;
  readonly cardSlug: string;
  readonly currentSettings: CustomerCardSettings;
  readonly persistence: {
    readonly configured: boolean;
    readonly mode: "persisted" | "fallback_defaults";
    readonly warning: string | null;
  };
  readonly publishedVersion: CardSettingsVersion | null;
  readonly tenantId: string;
  readonly versionHistory: readonly CardSettingsVersion[];
};

export type SettingsPublishApiData = {
  readonly result: SettingsPublishResult;
};

export type SettingsPagination = {
  readonly cursor: string | null;
  readonly limit: number;
};

export function createSettingsRequestId(seed: string): string {
  const normalized = seed.trim().toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  return `settings-api-${normalized || "request"}`;
}

export function settingsApiError(
  code: SettingsApiErrorCode,
  message: string,
  requestId: string
): SettingsApiFailure {
  return {
    error: {
      code,
      message,
      requestId
    },
    ok: false
  };
}

export function settingsApiSuccess<TData>(input: Omit<SettingsApiSuccess<TData>, "ok">): SettingsApiSuccess<TData> {
  return {
    ...input,
    ok: true
  };
}

export function assertValidSettingsSlug(slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Settings slug must use lowercase URL-safe words.");
  }

  return slug;
}

export function normalizeIdempotencyKey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (normalized.length < 8 || normalized.length > 128) {
    throw new Error("Idempotency key must be 8 to 128 characters.");
  }

  return normalized;
}

export function parseSettingsPagination(input: {
  readonly cursor?: string | null | undefined;
  readonly limit?: number | string | null | undefined;
}): SettingsPagination {
  const parsedLimit = typeof input.limit === "string"
    ? Number.parseInt(input.limit, 10)
    : input.limit ?? 25;
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(Number(parsedLimit), 1), 100) : 25;

  return {
    cursor: input.cursor?.trim() || null,
    limit
  };
}
