"use client";

import { Mic } from "lucide-react";
import type { ExecutiveSlug } from "@bidayax/types";

type ReceptionistVoiceChatProps = {
  readonly executiveSlug: ExecutiveSlug;
};

export function ReceptionistVoiceChat({ executiveSlug }: ReceptionistVoiceChatProps) {
  return (
    <section
      className="receptionist-voice-disabled"
      aria-labelledby={`voice-disabled-title-${executiveSlug}`}
    >
      <div>
        <Mic aria-hidden="true" size={20} strokeWidth={1.8} />
        <h3 id={`voice-disabled-title-${executiveSlug}`}>Live voice is unavailable</h3>
      </div>
      <p>
        Voice interaction is not active in this environment. Use Text Chat or Request Callback to reach the receptionist workflow without opening a microphone session.
      </p>
      <button
        aria-describedby={`voice-disabled-status-${executiveSlug}`}
        aria-disabled="true"
        className="receptionist-submit"
        type="button"
        disabled
      >
        Voice unavailable
      </button>
      <p
        aria-live="polite"
        className="receptionist-status"
        id={`voice-disabled-status-${executiveSlug}`}
        role="status"
        data-state="neutral"
      >
        No microphone is started and no voice-provider request is made. Text Chat and Request Callback remain available in this receptionist panel.
      </p>
    </section>
  );
}
