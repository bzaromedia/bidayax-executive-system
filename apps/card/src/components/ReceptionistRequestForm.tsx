"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  receptionistLanguageOptions,
  receptionistRequestTypeOptions
} from "@bidayax/config/receptionist";
import type {
  ExecutiveSlug,
  ReceptionistLanguage,
  ReceptionistRequestType,
  ReceptionistSettingsConfig
} from "@bidayax/types";
import { emitCardInteraction } from "../lib/card-events";
import {
  submitReceptionistRequest,
  type ReceptionistFormInput,
  type ReceptionistSubmitResult
} from "../lib/receptionist-client";

type ReceptionistRequestFormProps = {
  readonly executiveSlug: ExecutiveSlug;
  readonly settings?: ReceptionistSettingsConfig;
};

type FormStatus = "idle" | "submitting" | "success" | "error";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function buildInput(
  formData: FormData,
  executiveSlug: ExecutiveSlug,
  consentRequired: boolean
): ReceptionistFormInput {
  const company = getStringValue(formData, "company");
  const dialect = getStringValue(formData, "dialect");
  const phone = getStringValue(formData, "phone");
  const preferredTime = getStringValue(formData, "preferredTime");

  return {
    consent: consentRequired ? formData.get("consent") === "on" : true,
    email: getStringValue(formData, "email"),
    executiveSlug,
    message: getStringValue(formData, "message"),
    name: getStringValue(formData, "name"),
    preferredLanguage: getStringValue(
      formData,
      "preferredLanguage"
    ) as ReceptionistLanguage,
    requestType: getStringValue(formData, "requestType") as ReceptionistRequestType,
    ...(company ? { company } : {}),
    ...(dialect ? { dialect } : {}),
    ...(phone ? { phone } : {}),
    ...(preferredTime ? { preferredTime } : {})
  };
}

function resultMessage(result: ReceptionistSubmitResult | null) {
  if (!result) {
    return null;
  }

  const submittedMessage = "Request submitted. The receptionist will follow up shortly.";

  if (result.message) {
    return result.callbackWorkflow?.message
      ? `${result.message} ${result.callbackWorkflow.message}`
      : result.message;
  }

  if (!result.success) {
    if (result.providerStatus === "blocked_by_policy") {
      return "This request was not accepted because it failed safety or rate-limit checks.";
    }

    return "Please review the request details and submit again.";
  }

  if (result.providerStatus === "event_store_unavailable") {
    return "Your request is accepted, but the event store did not confirm persistence. The team should verify database connectivity.";
  }

  if (result.providerStatus === "provider_unconfigured") {
    return submittedMessage;
  }

  if (result.providerStatus === "requires_human_review") {
    return submittedMessage;
  }

  if (result.providerStatus === "queued" || result.providerStatus === "configured") {
    return submittedMessage;
  }

  return submittedMessage;
}

export function ReceptionistRequestForm({
  executiveSlug,
  settings
}: ReceptionistRequestFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [result, setResult] = useState<ReceptionistSubmitResult | null>(null);
  const startedRef = useRef(false);
  const languageOptions = settings
    ? receptionistLanguageOptions.filter((language) =>
        settings.supportedLanguages.includes(language.value)
      )
    : receptionistLanguageOptions;
  const requestTypeOptions = settings
    ? receptionistRequestTypeOptions.filter((requestType) =>
        settings.requestTypes.includes(requestType.value)
      )
    : receptionistRequestTypeOptions;
  const defaultLanguage = settings?.defaultLanguage ?? "English";
  const defaultRequestType = settings?.requestTypes[0] ?? "schedule_meeting";
  const consentRequired = settings?.consentRequired ?? true;

  function logStarted() {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    emitCardInteraction("receptionist_request_started", executiveSlug, {
      action: "receptionist_form_started",
      surface: "executive_receptionist_card"
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    logStarted();

    const formData = new FormData(event.currentTarget);
    const input = buildInput(formData, executiveSlug, consentRequired);

    if (!input.consent) {
      setStatus("error");
      setResult({
        error: "consent_required",
        providerStatus: "invalid",
        success: false
      });
      emitCardInteraction("receptionist_request_failed", executiveSlug, {
        action: "consent_missing",
        surface: "executive_receptionist_card"
      });
      return;
    }

    setStatus("submitting");

    try {
      const nextResult = await submitReceptionistRequest(input);
      setResult(nextResult);

      if (!nextResult.success) {
        setStatus("error");
        emitCardInteraction("receptionist_request_failed", executiveSlug, {
          action: "submit_failed",
          surface: "executive_receptionist_card"
        });
        return;
      }

      setStatus("success");
      event.currentTarget.reset();
      emitCardInteraction("receptionist_request_submitted", executiveSlug, {
        action: "submit_success",
        providerStatus: nextResult.providerStatus,
        requestType: input.requestType,
        surface: "executive_receptionist_card"
      });

      if (input.requestType === "schedule_meeting") {
        emitCardInteraction("receptionist_meeting_requested", executiveSlug, {
          action: "meeting_requested",
          surface: "executive_receptionist_card"
        });
      }

      if (input.requestType === "request_callback") {
        emitCardInteraction("receptionist_callback_requested", executiveSlug, {
          action: "callback_requested",
          surface: "executive_receptionist_card"
        });
      }

      if (input.requestType === "qualify_lead") {
        emitCardInteraction("receptionist_lead_qualified", executiveSlug, {
          action: "lead_qualified",
          surface: "executive_receptionist_card"
        });
      }
    } catch {
      setStatus("error");
      setResult({
        error: "request_failed",
        providerStatus: "event_store_unavailable",
        success: false
      });
      emitCardInteraction("receptionist_request_failed", executiveSlug, {
        action: "network_error",
        surface: "executive_receptionist_card"
      });
    }
  }

  return (
    <form
      aria-busy={status === "submitting"}
      className="receptionist-form receptionist-form-compact"
      onFocusCapture={logStarted}
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
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
        </label>
        <label>
          <span>Company</span>
          <input name="company" type="text" autoComplete="organization" maxLength={160} />
        </label>
        <label>
          <span>Language</span>
          <select name="preferredLanguage" defaultValue={defaultLanguage} required>
            {languageOptions.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Dialect</span>
          <input name="dialect" type="text" maxLength={80} />
        </label>
        <label>
          <span>Request</span>
          <select name="requestType" defaultValue={defaultRequestType} required>
            {requestTypeOptions.map((requestType) => (
              <option key={requestType.value} value={requestType.value}>
                {requestType.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Preferred time</span>
          <input name="preferredTime" type="text" maxLength={160} />
        </label>
      </div>
      <label className="receptionist-message">
        <span>Message</span>
        <textarea name="message" rows={3} required minLength={10} maxLength={2000} />
      </label>
      {consentRequired ? (
        <label className="receptionist-consent">
          <input name="consent" type="checkbox" required />
          <span>
            I consent to BidayaX LLC using this request to route executive
            follow-up.
          </span>
        </label>
      ) : null}
      <button
        className="receptionist-submit"
        type="submit"
        disabled={status === "submitting"}
        data-status={status}
      >
        {status === "submitting" ? "Submitting..." : "Submit Request"}
      </button>
      {result ? (
        <p
          aria-live="polite"
          className="receptionist-status"
          role="status"
          data-state={status === "success" ? "success" : "error"}
        >
          {resultMessage(result)}
        </p>
      ) : null}
    </form>
  );
}
