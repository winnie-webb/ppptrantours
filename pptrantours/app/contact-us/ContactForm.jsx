"use client";

import { useState } from "react";
import {
  FaCheckCircle,
  FaSpinner,
  FaWhatsapp,
  FaExclamationTriangle,
} from "react-icons/fa";
import { createBooking } from "@/lib/bookings";
import { site } from "@/app/data/site";

const SUBJECTS = [
  "Airport transfer",
  "A tour or excursion",
  "Cruise shore excursion",
  "Custom multi-day plan",
  "Something else",
];

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: SUBJECTS[0],
    date: "",
    adults: 2,
    notes: "",
  });
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const res = await createBooking({
        type: "enquiry",
        tourTitle: form.subject,
        pickupLabel: "To be confirmed",
        adults: Number(form.adults) || 1,
        children: 0,
        total: 0,
        ...form,
      });
      setResult(res);
      setStatus("done");
    } catch (err) {
      console.error("Enquiry failed", err);
      setError(
        "Something went wrong sending that. Please try again, or reach us on WhatsApp."
      );
      setStatus("error");
    }
  };

  if (status === "done" && result) {
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-crimson-50 text-2xl text-crimson-600">
          <FaCheckCircle />
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
          Message sent.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Your reference is{" "}
          <span className="font-semibold text-ink">{result.reference}</span>. We
          usually reply within the hour during dispatch hours.
        </p>
        {!result.persisted && (
          <p className="mx-auto mt-5 max-w-sm rounded-xl bg-gold-200/40 px-4 py-3 text-xs leading-relaxed text-ink/70">
            Message storage isn&apos;t switched on for this site yet — send it
            through on WhatsApp so it reaches us right away.
          </p>
        )}
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-7"
        >
          <FaWhatsapp className="text-lg" />
          Send on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">
            Full name
          </label>
          <input
            id="c-name"
            type="text"
            required
            value={form.name}
            onChange={set("name")}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="c-email" className="label">
            Email
          </label>
          <input
            id="c-email"
            type="email"
            required
            value={form.email}
            onChange={set("email")}
            className="field"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-phone" className="label">
            Phone / WhatsApp
          </label>
          <input
            id="c-phone"
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="c-subject" className="label">
            What do you need?
          </label>
          <select
            id="c-subject"
            value={form.subject}
            onChange={set("subject")}
            className="field"
          >
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-date" className="label">
            Travel date
          </label>
          <input
            id="c-date"
            type="date"
            value={form.date}
            onChange={set("date")}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="c-adults" className="label">
            Group size
          </label>
          <input
            id="c-adults"
            type="number"
            min={1}
            max={60}
            value={form.adults}
            onChange={set("adults")}
            className="field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="c-notes" className="label">
          Tell us about your trip
        </label>
        <textarea
          id="c-notes"
          rows={5}
          required
          placeholder="Where you're staying, what you'd like to see, your flight times — as much or as little as you have."
          value={form.notes}
          onChange={set("notes")}
          className="field resize-none"
        />
      </div>

      {status === "error" && (
        <p className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <FaExclamationTriangle className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary w-full disabled:opacity-60"
      >
        {status === "sending" ? (
          <>
            <FaSpinner className="animate-spin" />
            Sending…
          </>
        ) : (
          "Send message"
        )}
      </button>

      <p className="text-center text-xs text-ink/45">
        Or message {site.contact.phone} directly on WhatsApp — {site.hours}
      </p>
    </form>
  );
}
