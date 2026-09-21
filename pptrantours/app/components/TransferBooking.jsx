"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FaPlane } from "react-icons/fa";
import { placesByArea, getPlace } from "@/app/data/places";
import BookingForm from "./BookingForm";

/**
 * Booking an airport transfer, start to finish, on one page.
 *
 * This replaced the fare calculator that used to sit here. That widget asked
 * the three questions the booking form asks first — resort, direction, how
 * many — and then handed on a plain link carrying only the resort slug, so the
 * next page re-asked two of them from different defaults. The owner counted
 * nine or ten taps to book a transfer, and most of them were re-answers.
 *
 * Choosing a resort now reveals the real form underneath, already pointed at
 * that resort. The per-resort pages at /transfer/[place] still exist — they are
 * the SEO landing pages and take direct links — and run this same form, so
 * there is one booking path, not two.
 */
export default function TransferBooking({
  locale = "en",
  dict,
  /*
   * The product name, built on the server.
   *
   * It has to match what /transfer/[place] builds for the same resort: the
   * client posts `tourTitle` and the API stores it verbatim, so two spellings
   * here mean two names for one product in the owner's inbox. The string lives
   * in the `transferPage` dictionary namespace, which is not shipped to
   * clients, hence the prop.
   */
  titlePrefix = "Airport transfer to",
  paymentsEnabled = false,
  paypal = null,
}) {
  const t = dict?.fare ?? {};
  const [placeKey, setPlaceKey] = useState("");
  /*
   * Bumped to remount the form after a booking, which is the only time a
   * clean form is the right answer. While `booked` is set the picker is
   * hidden: a live resort select sitting above a confirmation screen looks
   * like it should do something, and does nothing.
   */
  const [booked, setBooked] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef(null);

  const grouped = useMemo(() => placesByArea((p) => p.transfer), []);
  const place = placeKey ? getPlace(placeKey) : null;

  /*
   * The shape BookingForm wants in transfer mode: a tour-like record whose
   * `place` is the destination. Identical to the one built server-side in
   * app/[locale]/transfer/[place]/page.jsx.
   */
  const asTour = useMemo(
    () =>
      place
        ? {
            id: `transfer-${place.key}`,
            title: `${titlePrefix} ${place.name}`,
            kind: "transfer",
            duration: "Door to door",
            place,
          }
        : null,
    [place, titlePrefix]
  );

  /*
   * The form appears below the fold on a phone, so a guest who picks a resort
   * sees nothing happen unless we take them to it. Focus moves with the scroll
   * rather than after it, so a screen reader announces the form rather than
   * leaving the caret on a select whose menu has just closed.
   */
  const onPick = useCallback((key) => {
    setPlaceKey(key);
    if (!key) return;
    requestAnimationFrame(() => {
      const el = formRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, []);

  const bookAnother = useCallback(() => {
    setBooked(false);
    setPlaceKey("");
    setFormKey((n) => n + 1);
  }, []);

  return (
    <div className="space-y-4">
      {booked && (
        <button type="button" onClick={bookAnother} className="btn-ghost">
          {t.another ?? "Book another transfer"}
        </button>
      )}

      {!booked && (
        <div className="card p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-ink/60">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
              <FaPlane className="text-xs" />
            </span>
            {t.from ?? "From Sangster International (MBJ)"}
          </div>

          <div className="mt-5">
            <label htmlFor="transfer-place" className="label">
              {t.destination ?? "Which resort are we taking you to?"}
            </label>
            <select
              id="transfer-place"
              value={placeKey}
              onChange={(e) => onPick(e.target.value)}
              className="field"
            >
              <option value="">
                {t.choose ?? "Choose your hotel or resort…"}
              </option>
              {grouped.map((group) => (
                <optgroup
                  key={group.key}
                  label={dict?.areas?.[group.key] ?? group.label}
                >
                  {group.places.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {!place && (
              <p className="mt-3 text-sm leading-relaxed text-ink/55">
                {t.chooseFirst ??
                  "Choose your resort and the rest of the booking appears here, price included."}
              </p>
            )}
          </div>
        </div>
      )}

      {/*
        The `key` is a counter, NOT the resort. Switching resorts re-prices the
        form in place and keeps whatever the guest has already typed; keying on
        the resort would remount and throw their name and email away for
        changing their mind about a hotel. The counter only moves when they ask
        for a fresh form after booking.
      */}
      {asTour && (
        <div ref={formRef} tabIndex={-1} className="scroll-mt-24 outline-none">
          <BookingForm
            key={formKey}
            tour={asTour}
            locale={locale}
            dict={dict}
            mode="transfer"
            paymentsEnabled={paymentsEnabled}
            paypal={paypal}
            onBooked={() => setBooked(true)}
          />
        </div>
      )}
    </div>
  );
}
