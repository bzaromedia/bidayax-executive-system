const anonymousVisitorStorageKey = "bidayax.anonymous_visitor_id";
const sessionStorageKey = "bidayax.session_id";

type InteractionSession = {
  readonly anonymousVisitorId: string;
  readonly sessionId: string;
};

function createAnonymousId(prefix: string) {
  const randomValue =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomValue}`;
}

function getOrCreateStorageValue(
  storage: Storage,
  key: string,
  prefix: string
) {
  const existingValue = storage.getItem(key);

  if (existingValue) {
    return existingValue;
  }

  const nextValue = createAnonymousId(prefix);
  storage.setItem(key, nextValue);

  return nextValue;
}

export function getInteractionSession(): InteractionSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return {
      anonymousVisitorId: getOrCreateStorageValue(
        window.localStorage,
        anonymousVisitorStorageKey,
        "bxv"
      ),
      sessionId: getOrCreateStorageValue(
        window.sessionStorage,
        sessionStorageKey,
        "bxs"
      )
    };
  } catch {
    return null;
  }
}
