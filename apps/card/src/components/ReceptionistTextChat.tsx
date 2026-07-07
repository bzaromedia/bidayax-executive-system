"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ExecutiveSlug } from "@bidayax/types";
import { emitCardInteraction } from "../lib/card-events";
import {
  submitReceptionistRequest,
  type ReceptionistSubmitResult
} from "../lib/receptionist-client";

type ReceptionistTextChatProps = {
  readonly executiveSlug: ExecutiveSlug;
};

type ChatStatus = "idle" | "submitting" | "success" | "error";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export function ReceptionistTextChat({ executiveSlug }: ReceptionistTextChatProps) {
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [result, setResult] = useState<ReceptionistSubmitResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = textValue(formData, "name");
    const email = textValue(formData, "email");
    const message = textValue(formData, "message");

    setStatus("submitting");

    try {
      const nextResult = await submitReceptionistRequest(
        {
          consent: true,
          email,
          executiveSlug,
          message,
          name,
          preferredLanguage: "English",
          requestType: "route_message"
        },
        { endpoint: "/api/receptionist/chat" }
      );

      setResult(nextResult);
      setStatus(nextResult.success ? "success" : "error");
      emitCardInteraction(
        nextResult.success
          ? "receptionist_request_submitted"
          : "receptionist_request_failed",
        executiveSlug,
        {
          action: nextResult.success ? "chat_submitted" : "chat_failed",
          surface: "polyglot_text_chat"
        }
      );

      if (nextResult.success) {
        formRef.current?.reset();
      }
    } catch {
      setResult({
        error: "chat_request_failed",
        providerStatus: "event_store_unavailable",
        success: false
      });
      setStatus("error");
    }
  }

  return (
    <form
      ref={formRef}
      aria-busy={status === "submitting"}
      className="receptionist-form receptionist-form-compact receptionist-chat-form"
      onSubmit={handleSubmit}
    >
      <div className="receptionist-grid">
        <label>
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" maxLength={120} required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
      </div>
      <label className="receptionist-message">
        <span>Message</span>
        <textarea name="message" rows={3} required minLength={10} maxLength={2000} />
      </label>
      <button className="receptionist-submit" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : "Send Message"}
      </button>
      {result ? (
        <p
          aria-live="polite"
          className="receptionist-status"
          role="status"
          data-state={status === "success" ? "success" : "error"}
        >
          {result.success
            ? "Message queued. The receptionist workflow will route it for follow-up."
            : "The message could not be queued. Please review and try again."}
        </p>
      ) : null}
    </form>
  );
}
