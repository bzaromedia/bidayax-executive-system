"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import type { ExecutiveSlug } from "@bidayax/types";
import { emitCardInteraction } from "../lib/card-events";
import {
  submitReceptionistRequest,
  type ReceptionistSubmitResult
} from "../lib/receptionist-client";

type ReceptionistVoiceChatProps = {
  readonly executiveSlug: ExecutiveSlug;
};

type VoiceStatus = "idle" | "submitting" | "success" | "error";

export function ReceptionistVoiceChat({ executiveSlug }: ReceptionistVoiceChatProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [result, setResult] = useState<ReceptionistSubmitResult | null>(null);

  async function queueTranscriptMode() {
    setStatus("submitting");

    try {
      const nextResult = await submitReceptionistRequest(
        {
          consent: true,
          email: "contact@theexecutivecard.com",
          executiveSlug,
          message:
            "Voice chat transcript placeholder requested. Realtime voice provider is not configured, so queue a human-approved follow-up task.",
          name: "Voice Chat Visitor",
          preferredLanguage: "English",
          requestType: "route_message"
        },
        { endpoint: "/api/receptionist/voice-chat" }
      );

      setResult(nextResult);
      setStatus(nextResult.success ? "success" : "error");
      emitCardInteraction(
        nextResult.success
          ? "receptionist_request_submitted"
          : "receptionist_request_failed",
        executiveSlug,
        {
          action: nextResult.success ? "voice_chat_queued" : "voice_chat_failed",
          surface: "polyglot_voice_chat"
        }
      );
    } catch {
      setResult({
        error: "voice_chat_request_failed",
        providerStatus: "event_store_unavailable",
        success: false
      });
      setStatus("error");
    }
  }

  return (
    <section className="receptionist-voice-placeholder" aria-label="Voice chat request">
      <div>
        <Mic aria-hidden="true" size={20} strokeWidth={1.8} />
        <h3>Voice Chat</h3>
      </div>
      <p>
        Live realtime providers remain disabled until credentials are configured. Transcript mode queues a safe internal request now.
      </p>
      <button
        className="receptionist-submit"
        type="button"
        disabled={status === "submitting"}
        onClick={queueTranscriptMode}
      >
        {status === "submitting" ? "Queuing..." : "Queue Voice Chat"}
      </button>
      {result ? (
        <p
          aria-live="polite"
          className="receptionist-status"
          role="status"
          data-state={status === "success" ? "success" : "error"}
        >
          {result.success
            ? "Voice chat request queued pending realtime provider configuration."
            : "Voice chat request could not be queued."}
        </p>
      ) : null}
    </section>
  );
}
