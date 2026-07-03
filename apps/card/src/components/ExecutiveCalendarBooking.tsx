"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { ExecutiveCalendarSlot, ExecutiveProfile } from "@bidayax/config/executives";
import { emitCardInteraction } from "../lib/card-events";
import { getExecutiveCalendarSlots } from "../lib/calendar";
import {
  submitReceptionistRequest,
  type ReceptionistSubmitResult
} from "../lib/receptionist-client";

type ExecutiveCalendarBookingProps = {
  readonly executive: ExecutiveProfile;
};

type CalendarStatus = "idle" | "submitting" | "success" | "error";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getQueuedStatus(result: ReceptionistSubmitResult | null) {
  if (!result) {
    return null;
  }

  return result.providerStatus === "provider_unconfigured"
    ? "internal_request_queued"
    : result.providerStatus;
}

function getSlotByValue(
  slots: readonly ExecutiveCalendarSlot[],
  value: string
) {
  return slots.find((slot) => slot.value === value) ?? slots.at(0);
}

export function ExecutiveCalendarBooking({
  executive
}: ExecutiveCalendarBookingProps) {
  const slots = getExecutiveCalendarSlots(executive);
  const [selectedSlotValue, setSelectedSlotValue] = useState(
    slots.at(0)?.value ?? ""
  );
  const [status, setStatus] = useState<CalendarStatus>("idle");
  const [result, setResult] = useState<ReceptionistSubmitResult | null>(null);
  const selectedSlot = getSlotByValue(slots, selectedSlotValue);

  useEffect(() => {
    emitCardInteraction("calendar_view", executive.slug, {
      action: "calendar_route_load",
      surface: "executive_calendar"
    });
  }, [executive.slug]);

  function handleSlotChange(value: string) {
    setSelectedSlotValue(value);
    emitCardInteraction("calendar_slot_selected", executive.slug, {
      action: "slot_selected",
      slot: value,
      surface: "executive_calendar"
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSlot) {
      setStatus("error");
      setResult({
        error: "slot_required",
        providerStatus: "invalid",
        success: false
      });
      emitCardInteraction("calendar_request_failed", executive.slug, {
        action: "slot_missing",
        surface: "executive_calendar"
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const message = getStringValue(formData, "message");
    const company = getStringValue(formData, "company");

    setStatus("submitting");

    try {
      const nextResult = await submitReceptionistRequest({
        consent: true,
        email: getStringValue(formData, "email"),
        executiveSlug: executive.slug,
        message: [
          `Calendar request for ${selectedSlot.label} (${selectedSlot.timezone}).`,
          message || "No additional message provided."
        ].join("\n\n"),
        name: getStringValue(formData, "name"),
        preferredLanguage: "English",
        preferredTime: `${selectedSlot.label} (${selectedSlot.timezone})`,
        requestType: "schedule_meeting",
        ...(company ? { company } : {})
      });

      setResult(nextResult);

      if (!nextResult.success) {
        setStatus("error");
        emitCardInteraction("calendar_request_failed", executive.slug, {
          action: "submit_failed",
          providerStatus: nextResult.providerStatus,
          slot: selectedSlot.value,
          surface: "executive_calendar"
        });
        return;
      }

      setStatus("success");
      emitCardInteraction("calendar_request_submitted", executive.slug, {
        action: "internal_request_queued",
        providerStatus: getQueuedStatus(nextResult),
        requestType: "schedule_meeting",
        slot: selectedSlot.value,
        surface: "executive_calendar"
      });
    } catch {
      setStatus("error");
      setResult({
        error: "request_failed",
        providerStatus: "event_store_unavailable",
        success: false
      });
      emitCardInteraction("calendar_request_failed", executive.slug, {
        action: "network_error",
        slot: selectedSlot.value,
        surface: "executive_calendar"
      });
    }
  }

  return (
    <section className="executive-calendar" aria-labelledby="calendar-title">
      <div className="executive-calendar-heading">
        <a className="executive-text-link" href={`/card/${executive.slug}`}>
          Back to card
        </a>
        <p>{executive.displayName}</p>
        <h1 id="calendar-title">Book a Meeting</h1>
        <span>
          Choose an internal availability window. This does not claim a live
          calendar provider; the request is queued for executive follow-up.
        </span>
      </div>

      <form className="executive-calendar-form" onSubmit={handleSubmit}>
        <fieldset className="executive-calendar-slots">
          <legend>Available date and time options</legend>
          {slots.map((slot) => (
            <label key={slot.value} className="executive-calendar-slot">
              <input
                checked={selectedSlotValue === slot.value}
                name="calendarSlot"
                onChange={() => handleSlotChange(slot.value)}
                required
                type="radio"
                value={slot.value}
              />
              <span>
                <strong>{slot.label}</strong>
                <small>{slot.timezone}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="executive-calendar-grid">
          <label>
            <span>Name</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            <span>Company</span>
            <input name="company" type="text" autoComplete="organization" required />
          </label>
          <label className="executive-calendar-message">
            <span>Message</span>
            <small>Share the meeting context.</small>
            <textarea name="message" rows={4} />
          </label>
        </div>

        <button
          className="executive-calendar-submit"
          disabled={status === "submitting"}
          type="submit"
        >
          {status === "submitting" ? "Queuing request" : "Request Meeting"}
        </button>

        {result ? (
          <p
            className="executive-calendar-status"
            data-state={status === "success" ? "success" : "error"}
            data-provider-status={getQueuedStatus(result) ?? undefined}
            role="status"
          >
            {status === "success"
              ? "Meeting request queued for executive follow-up."
              : "The meeting request could not be queued. Please review the form and try again."}
          </p>
        ) : null}
      </form>
    </section>
  );
}
