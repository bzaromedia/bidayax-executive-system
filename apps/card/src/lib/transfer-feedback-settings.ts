import type { QRTransferFeedbackConfig } from "@bidayax/types";

export type TransferFeedbackSettings = Pick<
  QRTransferFeedbackConfig,
  "animationEnabled" | "hapticsEnabled" | "soundEnabled"
>;

type TransferFeedbackStorage = Pick<Storage, "getItem" | "setItem">;

export const transferFeedbackSettingsStorageKey =
  "the-executive-card.transfer-feedback-settings";

export const defaultTransferFeedbackSettings: TransferFeedbackSettings = {
  animationEnabled: true,
  hapticsEnabled: true,
  soundEnabled: false
};

function normalizeTransferFeedbackSettings(
  value: Partial<TransferFeedbackSettings> | null | undefined,
  defaults: TransferFeedbackSettings = defaultTransferFeedbackSettings
): TransferFeedbackSettings {
  return {
    animationEnabled: value?.animationEnabled ?? defaults.animationEnabled,
    hapticsEnabled: value?.hapticsEnabled ?? defaults.hapticsEnabled,
    soundEnabled: value?.soundEnabled ?? defaults.soundEnabled
  };
}

export function getBrowserTransferFeedbackStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function readTransferFeedbackSettings(
  storage: TransferFeedbackStorage | null | undefined =
    getBrowserTransferFeedbackStorage(),
  defaults: TransferFeedbackSettings = defaultTransferFeedbackSettings
): TransferFeedbackSettings {
  if (!storage) {
    return defaults;
  }

  try {
    const rawValue = storage.getItem(transferFeedbackSettingsStorageKey);

    if (!rawValue) {
      return defaults;
    }

    return normalizeTransferFeedbackSettings(
      JSON.parse(rawValue) as Partial<TransferFeedbackSettings>,
      defaults
    );
  } catch {
    return defaults;
  }
}

export function writeTransferFeedbackSettings(
  settings: Partial<TransferFeedbackSettings>,
  storage: TransferFeedbackStorage | null | undefined =
    getBrowserTransferFeedbackStorage(),
  defaults: TransferFeedbackSettings = defaultTransferFeedbackSettings
): TransferFeedbackSettings {
  const nextSettings = normalizeTransferFeedbackSettings(settings, defaults);

  try {
    storage?.setItem(
      transferFeedbackSettingsStorageKey,
      JSON.stringify(nextSettings)
    );
  } catch {
    // Local preference persistence must never block the card experience.
  }

  return nextSettings;
}

export function updateTransferFeedbackSetting(
  key: keyof TransferFeedbackSettings,
  enabled: boolean,
  storage: TransferFeedbackStorage | null | undefined =
    getBrowserTransferFeedbackStorage(),
  defaults: TransferFeedbackSettings = defaultTransferFeedbackSettings
): TransferFeedbackSettings {
  return writeTransferFeedbackSettings(
    {
      ...readTransferFeedbackSettings(storage, defaults),
      [key]: enabled
    },
    storage,
    defaults
  );
}
