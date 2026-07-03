export type TransferFeedbackSettings = {
  readonly hapticsEnabled: boolean;
  readonly soundEnabled: boolean;
  readonly animationEnabled: boolean;
};

type TransferFeedbackStorage = Pick<Storage, "getItem" | "setItem">;

export const transferFeedbackSettingsStorageKey =
  "the-executive-card.transfer-feedback-settings";

export const defaultTransferFeedbackSettings: TransferFeedbackSettings = {
  hapticsEnabled: true,
  soundEnabled: false,
  animationEnabled: true
};

function normalizeTransferFeedbackSettings(
  value: Partial<TransferFeedbackSettings> | null | undefined
): TransferFeedbackSettings {
  return {
    hapticsEnabled:
      value?.hapticsEnabled ?? defaultTransferFeedbackSettings.hapticsEnabled,
    soundEnabled: value?.soundEnabled ?? defaultTransferFeedbackSettings.soundEnabled,
    animationEnabled:
      value?.animationEnabled ?? defaultTransferFeedbackSettings.animationEnabled
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
    getBrowserTransferFeedbackStorage()
): TransferFeedbackSettings {
  if (!storage) {
    return defaultTransferFeedbackSettings;
  }

  try {
    const rawValue = storage.getItem(transferFeedbackSettingsStorageKey);

    if (!rawValue) {
      return defaultTransferFeedbackSettings;
    }

    return normalizeTransferFeedbackSettings(
      JSON.parse(rawValue) as Partial<TransferFeedbackSettings>
    );
  } catch {
    return defaultTransferFeedbackSettings;
  }
}

export function writeTransferFeedbackSettings(
  settings: Partial<TransferFeedbackSettings>,
  storage: TransferFeedbackStorage | null | undefined =
    getBrowserTransferFeedbackStorage()
): TransferFeedbackSettings {
  const nextSettings = normalizeTransferFeedbackSettings(settings);

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
    getBrowserTransferFeedbackStorage()
): TransferFeedbackSettings {
  return writeTransferFeedbackSettings(
    {
      ...readTransferFeedbackSettings(storage),
      [key]: enabled
    },
    storage
  );
}