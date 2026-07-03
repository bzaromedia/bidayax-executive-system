import type { QRTransferFeedbackConfig } from "@bidayax/types";

export type ResolvedQRFeedbackSettings = Pick<
  QRTransferFeedbackConfig,
  "animationEnabled" | "hapticsEnabled" | "soundEnabled"
>;

export const defaultQrTransferFeedbackSettings: ResolvedQRFeedbackSettings = {
  animationEnabled: true,
  hapticsEnabled: true,
  soundEnabled: false
};

export function resolveQrTransferFeedbackSettings(
  settings: QRTransferFeedbackConfig | null | undefined
): ResolvedQRFeedbackSettings {
  if (!settings) {
    return defaultQrTransferFeedbackSettings;
  }

  return {
    animationEnabled: settings.animationEnabled,
    hapticsEnabled: settings.hapticsEnabled,
    soundEnabled: settings.soundEnabled
  };
}
