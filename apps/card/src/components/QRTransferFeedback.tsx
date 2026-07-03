"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";
import {
  canAttemptTransferSound,
  getTransferAnimationEnabled,
  isQrTransferUrl,
  triggerTransferHaptics,
  type TransferFeedbackKind
} from "../lib/transfer-feedback";
import {
  defaultTransferFeedbackSettings,
  getBrowserTransferFeedbackStorage,
  readTransferFeedbackSettings,
  writeTransferFeedbackSettings,
  type TransferFeedbackSettings
} from "../lib/transfer-feedback-settings";
import { TransferFeedbackSettings as TransferFeedbackSettingsPanel } from "./TransferFeedbackSettings";

type QRTransferFeedbackProps = {
  readonly defaultSettings?: TransferFeedbackSettings;
  readonly executive: ExecutiveProfile;
  readonly initialState?: TransferFeedbackKind;
};

type BrowserWindowWithAudio = Window & {
  readonly webkitAudioContext?: typeof AudioContext;
};

const toggleEventByKey = {
  animationEnabled: "qr_transfer_animation_toggled",
  hapticsEnabled: "qr_transfer_haptics_toggled",
  soundEnabled: "qr_transfer_sound_toggled"
} as const satisfies Record<keyof TransferFeedbackSettings, string>;

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as BrowserWindowWithAudio;

  return window.AudioContext ?? browserWindow.webkitAudioContext ?? null;
}

function playTone(
  context: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  gainNode: GainNode
) {
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, context.currentTime + startOffset);
  oscillator.connect(gainNode);
  oscillator.start(context.currentTime + startOffset);
  oscillator.stop(context.currentTime + startOffset + duration);
}

async function playTransferFeedbackTone(
  kind: TransferFeedbackKind,
  settings: TransferFeedbackSettings
) {
  if (!canAttemptTransferSound(settings)) {
    return false;
  }

  try {
    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) {
      return false;
    }

    const context = new AudioContextConstructor();
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    gainNode.connect(context.destination);

    if (kind === "success") {
      playTone(context, 660, 0, 0.12, gainNode);
      playTone(context, 880, 0.15, 0.16, gainNode);
    } else {
      playTone(context, 220, 0, 0.18, gainNode);
    }

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 520);

    return true;
  } catch {
    return false;
  }
}

export function QRTransferFeedback({
  defaultSettings = defaultTransferFeedbackSettings,
  executive,
  initialState = "success"
}: QRTransferFeedbackProps) {
  const initializedRef = useRef(false);
  const dismissTimerRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<TransferFeedbackKind>(initialState);
  const [settings, setSettings] = useState<TransferFeedbackSettings>(defaultSettings);
  const [isReducedMotion, setIsReducedMotion] = useState(true);

  useEffect(() => {
    setIsReducedMotion(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const nextSettings = readTransferFeedbackSettings(
      getBrowserTransferFeedbackStorage(),
      defaultSettings
    );
    const shouldShow =
      initialState === "failure" || isQrTransferUrl(window.location.href);

    setSettings(nextSettings);
    setStatus(initialState);

    if (!shouldShow) {
      return;
    }

    setIsVisible(true);

    emitCardInteraction("qr_transfer_detected", executive.slug, {
      action: "qr_transfer_detected",
      surface: "executive_card_receiver"
    });

    const feedbackEvent =
      initialState === "success"
        ? "qr_transfer_success_feedback"
        : "qr_transfer_failure_feedback";

    emitCardInteraction(feedbackEvent, executive.slug, {
      action: feedbackEvent,
      hapticsEnabled: nextSettings.hapticsEnabled,
      soundEnabled: nextSettings.soundEnabled,
      surface: "executive_card_receiver"
    });

    triggerTransferHaptics(nextSettings, window.navigator, initialState);
    void playTransferFeedbackTone(initialState, nextSettings);

    dismissTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 7200);

    return () => {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, [defaultSettings, executive.slug, initialState]);

  function handleSettingsChange(
    nextSettings: TransferFeedbackSettings,
    changedKey: keyof TransferFeedbackSettings
  ) {
    const storedSettings = writeTransferFeedbackSettings(
      nextSettings,
      getBrowserTransferFeedbackStorage(),
      defaultSettings
    );

    setSettings(storedSettings);

    emitCardInteraction(toggleEventByKey[changedKey], executive.slug, {
      action: toggleEventByKey[changedKey],
      enabled: storedSettings[changedKey],
      surface: "qr_transfer_feedback_settings"
    });
  }

  if (!isVisible) {
    return null;
  }

  const isSuccess = status === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <aside
      aria-live="polite"
      className="qr-transfer-feedback"
      data-animation={
        getTransferAnimationEnabled(settings, isReducedMotion)
          ? "enabled"
          : "disabled"
      }
      data-status={status}
    >
      <div className="qr-transfer-feedback-main">
        <span className="qr-transfer-feedback-icon" aria-hidden="true">
          <Icon size={22} strokeWidth={2} />
        </span>
        <div className="qr-transfer-feedback-copy">
          <h2>{isSuccess ? "Executive Card received" : "Executive Card unavailable"}</h2>
          <p>
            {isSuccess
              ? "This receiving device opened the QR transfer route."
              : "This card route could not be validated for transfer feedback."}
          </p>
        </div>
        <button
          aria-label="Dismiss QR transfer feedback"
          className="qr-transfer-feedback-close"
          type="button"
          onClick={() => setIsVisible(false)}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
      {isSuccess ? (
        <a
          className="qr-transfer-feedback-save"
          download={executive.vcardFileName}
          href={`/card/${executive.slug}/vcard`}
          onClick={() =>
            emitCardInteraction("vcard_download", executive.slug, {
              action: "save_contact_from_qr_transfer_feedback",
              surface: "qr_transfer_feedback"
            })
          }
        >
          Save Contact
        </a>
      ) : null}
      <TransferFeedbackSettingsPanel
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </aside>
  );
}
