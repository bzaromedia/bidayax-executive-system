"use client";

import type { ChangeEvent } from "react";
import type { TransferFeedbackSettings as TransferFeedbackSettingsConfig } from "../lib/transfer-feedback-settings";

type TransferFeedbackSettingsProps = {
  readonly settings: TransferFeedbackSettingsConfig;
  readonly onSettingsChange: (
    settings: TransferFeedbackSettingsConfig,
    changedKey: keyof TransferFeedbackSettingsConfig
  ) => void;
};

const settingOptions = [
  {
    description: "Use supported device vibration after a QR transfer opens.",
    key: "hapticsEnabled",
    label: "Haptics"
  },
  {
    description: "Play a generated confirmation tone after browser permission.",
    key: "soundEnabled",
    label: "Sound"
  },
  {
    description: "Show the receiver-side confirmation motion.",
    key: "animationEnabled",
    label: "Animation"
  }
] as const;

export function TransferFeedbackSettings({
  settings,
  onSettingsChange
}: TransferFeedbackSettingsProps) {
  function handleChange(
    key: keyof TransferFeedbackSettingsConfig,
    event: ChangeEvent<HTMLInputElement>
  ) {
    onSettingsChange(
      {
        ...settings,
        [key]: event.target.checked
      },
      key
    );
  }

  return (
    <details className="transfer-feedback-settings">
      <summary>Feedback settings</summary>
      <div className="transfer-feedback-settings-options">
        {settingOptions.map((option) => (
          <label className="transfer-feedback-setting" key={option.key}>
            <span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
            <input
              checked={settings[option.key]}
              type="checkbox"
              onChange={(event) => handleChange(option.key, event)}
            />
          </label>
        ))}
      </div>
    </details>
  );
}