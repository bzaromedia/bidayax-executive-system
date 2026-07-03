import type {
  ExecutiveSlug,
  InteractionEventMetadata,
  InteractionEventRequest,
  InteractionEventType
} from "./event-types";
import { getInteractionSession } from "./session";
import { isQrTransferUrl } from "./transfer-feedback";

const eventEndpoint = "/api/events";

function getSourceUrl() {
  try {
    return window.location.href;
  } catch {
    return null;
  }
}

function getReferrer() {
  return document.referrer.length > 0 ? document.referrer : null;
}

function isQrEntry() {
  return isQrTransferUrl(window.location.href);
}

export function getCardLoadEventTypes(): readonly InteractionEventType[] {
  return isQrEntry() ? ["qr_scan", "card_view"] : ["card_view"];
}

export function emitCardInteraction(
  eventType: InteractionEventType,
  executiveSlug: ExecutiveSlug,
  metadata: InteractionEventMetadata = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  const session = getInteractionSession();

  if (!session) {
    return;
  }

  const sourceUrl = getSourceUrl();
  const referrer = getReferrer();
  const payload: InteractionEventRequest = {
    eventType,
    executiveSlug,
    sessionId: session.sessionId,
    anonymousVisitorId: session.anonymousVisitorId,
    ...(sourceUrl ? { sourceUrl } : {}),
    ...(referrer ? { referrer } : {}),
    metadata: {
      ...metadata,
      route: window.location.pathname
    }
  };
  const body = JSON.stringify(payload);

  try {
    if (window.navigator.sendBeacon) {
      const beaconBody = new Blob([body], { type: "application/json" });

      if (window.navigator.sendBeacon(eventEndpoint, beaconBody)) {
        return;
      }
    }
  } catch {
    // Fall through to fetch. Event capture must never block card actions.
  }

  void window
    .fetch(eventEndpoint, {
      body,
      headers: {
        "content-type": "application/json"
      },
      keepalive: true,
      method: "POST"
    })
    .catch(() => undefined);
}
