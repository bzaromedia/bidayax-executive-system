import type { TransferFeedbackSettings } from "./transfer-feedback-settings";

export type TransferFeedbackKind = "success" | "failure";

type NavigatorWithVibration = {
  readonly vibrate?: (pattern: number | number[]) => boolean;
};

export const transferFeedbackSuccessPattern = [35, 20, 45] as const;
export const transferFeedbackFailurePattern = [70, 35, 70] as const;

export function isQrTransferUrl(href: string) {
  try {
    const url = new URL(href, "https://theexecutivecard.online");

    if (url.searchParams.get("scan") === "1") {
      return true;
    }

    return (
      url.searchParams.get("source") === "qr" ||
      url.searchParams.get("entry") === "qr" ||
      url.searchParams.get("utm_source") === "qr"
    );
  } catch {
    return false;
  }
}

export function getTransferAnimationEnabled(
  settings: TransferFeedbackSettings,
  prefersReducedMotion: boolean
) {
  return settings.animationEnabled && !prefersReducedMotion;
}

export function triggerTransferHaptics(
  settings: TransferFeedbackSettings,
  navigatorLike: NavigatorWithVibration | null | undefined,
  kind: TransferFeedbackKind
) {
  if (!settings.hapticsEnabled || typeof navigatorLike?.vibrate !== "function") {
    return false;
  }

  const pattern =
    kind === "success"
      ? [...transferFeedbackSuccessPattern]
      : [...transferFeedbackFailurePattern];

  try {
    return navigatorLike.vibrate(pattern);
  } catch {
    return false;
  }
}

export function canAttemptTransferSound(settings: TransferFeedbackSettings) {
  return settings.soundEnabled;
}