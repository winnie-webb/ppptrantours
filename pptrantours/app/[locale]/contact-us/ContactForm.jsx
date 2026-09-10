"use client";

import { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaSpinner,
  FaWhatsapp,
  FaExclamationTriangle,
} from "react-icons/fa";
import { createBooking } from "@/lib/bookings";
import { site } from "@/app/data/site";

/**
 * Canonical, English, and index-aligned with `contactForm.subjects` in every
 * `app/i18n/messages/*.json`.
 *
 * The select's value is the *index*, not the label. Two reasons. The guest reads
 * their own language while `subject` still reaches the inbox in one language the
 * owner can sort on. And the control is genuinely controlled: previously `value`
 * was seeded from an English label while the options rendered from the
 * dictionary, so in nine of ten locales the value matched no option at all, and
 * a guest who never opened the dropdown silently submitted English.
 *
 * DEPENDENCY: keep the length and order in step with the dictionaries.
 */
const SUBJECTS_EN = [
  "Airport transfer",
  "Tour or excursion",
  "Combo tour package",
  "Cruise shore excursion",
  "Group or wedding transport",
  "Something else",
];

/** Today in the guest's timezone, as `<input type="date">` wants it. */
function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Asterisk beside a required label; the input carries the real ARIA. */
function Req() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-crimson-600">
      *
    </span>
  );
}

export default function ContactForm({ dict }) {
  const t = dict?.contactForm ?? {};
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: 0,
    date: "",
    adults: 2,
    notes: "",
  });
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Filled in after mount so the first client render matches the prerender.
  const [minDate, setMinDate] = useState("");
  useEffect(() => setMinDate(todayISO()), []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const subjectLabel =
    SUBJECTS_EN[Number(form.subject)] ?? SUBJECTS_EN[SUBJECTS_EN.length - 1];

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      // `...form` goes first: spreading it last used to overwrite the coerced
      // `adults` with the raw string straight back out of the input.
      const res = await createBooking({
        ...form,
        type: "enquiry",
        subject: subjectLabel,
        tourTitle: subjectLabel,
        pickupLabel: "To be confirmed",
        adults: Number(form.adults) || 1,
        children: 0,
        total: 0,
      });
      setResult(res);
      setStatus("done");
    } catch (err) {
      console.error("Enquiry failed", err);
      setError(
        t.error ??
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
          {t.doneTitle ?? "Message sent."}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          {t.doneRef ?? "Your reference is"}{" "}
          <span className="font-semibold text-ink">{result.reference}</span>.{" "}
          {t.doneBody ?? "We usually reply within the hour during dispatch hours."}
        </p>
        {!result.persisted && (
          <p className="mx-auto mt-5 max-w-sm rounded-xl bg-gold-200/40 px-4 py-3 text-xs leading-relaxed text-ink/70">
            {t.notPersisted ??
              "Message storage isn't switched on for this site yet — send it through on WhatsApp so it reaches us right away."}
          </p>
        )}
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-7"
        >
          <FaWhatsapp className="text-lg" />
          {t.sendWhatsApp ?? "Send on WhatsApp"}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">
            {t.name ?? "Full name"}
            <Req />
          </label>
          <input
            id="c-name"
            type="text"
            required
            aria-required="true"
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="c-email" className="label">
            {t.email ?? "Email"}
            <Req />
          </label>
          <input
            id="c-email"
            type="email"
            required
            aria-required="true"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            className="field"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-phone" className="label">
            {t.phone ?? "Phone / WhatsApp"}
          </label>
          <input
            id="c-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="c-subject" className="label">
            {t.subject ?? "What do you need?"}
          </label>
          <select
            id="c-subject"
            value={form.subject}
            onChange={set("subject")}
            className="field"
          >
            {SUBJECTS_EN.map((fallback, i) => (
              <option key={i} value={i}>
                {t.subjects?.[i] ?? fallback}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-date" className="label">
            {t.date ?? "Travel date"}
          </label>
          <input
            id="c-date"
            type="date"
            min={minDate || undefined}
            value={form.date}
            onChange={set("date")}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="c-adults" className="label">
            {t.groupSize ?? "Group size"}
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
          {t.notes ?? "Tell us about your trip"}
          <Req />
        </label>
        <textarea
          id="c-notes"
          rows={5}
          required
          aria-required="true"
          placeholder={
            t.notesPlaceholder ??
            "Where you're staying, what you'd like to see, your flight times — as much or as little as you have."
          }
          value={form.notes}
          onChange={set("notes")}
          className="field resize-none"
        />
      </div>

      {status === "error" && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <FaExclamationTriangle className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <p className="text-xs text-ink/60">
        <span aria-hidden="true" className="text-crimson-600">
          *
        </span>{" "}
        {t.requiredNote ?? "Required. Everything else helps but is optional."}
      </p>

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary w-full disabled:opacity-60"
      >
        {status === "sending" ? (
          <>
            <FaSpinner className="animate-spin" />
            {t.sending ?? "Sending…"}
          </>
        ) : (
          t.submit ?? "Send message"
        )}
      </button>

      <p className="text-center text-xs text-ink/45">
        {t.footnote?.replace("{phone}", site.contact.phone) ??
          `Or message ${site.contact.phone} directly on WhatsApp`}
      </p>
    </form>
  );
}
