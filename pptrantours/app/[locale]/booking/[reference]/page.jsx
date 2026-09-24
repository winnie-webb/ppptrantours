import Link from "next/link";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaWhatsapp,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import { site } from "@/app/data/site";
import { fromCents, money, describeDirection } from "@/app/products/pricing";
import { getBooking } from "@/lib/payments/store";
import { paymentsConfigured, paypalPublicConfig } from "@/lib/payments";
import { buildWhatsAppMessage } from "@/lib/booking-shared";
import { localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";
import BookingPaymentSection from "@/app/components/booking/BookingPaymentSection";

export const dynamic = "force-dynamic";

/**
 * Where every booking lives, and where a guest lands after the hosted
 * payment page.
 *
 * Two things read this URL, and they must never be allowed to disagree:
 * payment STATE is read from Firestore, never from the query string — `?state=`
 * is only a hint for the copy while a write settles, anyone can edit it, so it
 * can never be what decides whether the page says "paid". `?p=` is the
 * booking's `lookupToken`; without it (or with the wrong one) the page shows
 * a neutral outcome and no booking detail at all — a six-character reference
 * from a 32-letter alphabet is not enough protection on its own for a
 * guest's name, travel dates and contact details.
 *
 * `BookingForm` sends every booking here now (08_IMPLEMENTATION_PLAN.md
 * Phase 4), not only the ones that went through a payment redirect, so this
 * also has to render sensibly for a guest who has never touched a payment
 * page at all — the plain "just booked, paying cash" visit — which the
 * original payment-return version of this page did not have a case for.
 *
 * noindex, and dynamic — there is nothing here to cache or crawl.
 */
export const metadata = {
  title: "Your booking",
  robots: { index: false, follow: false, nocache: true },
};

function Shell({ children }) {
  return (
    <section className="shell py-16 lg:py-24">
      <div className="mx-auto max-w-xl">{children}</div>
    </section>
  );
}

function SummaryRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ink/60">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}

export default async function BookingResultPage({ params, searchParams }) {
  const { locale, reference } = await params;
  const query = await searchParams;
  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.bookingResult ?? {};
  const tb = dict.booking ?? {};

  const token = typeof query?.p === "string" ? query.p : null;
  const hint = typeof query?.state === "string" ? query.state : null;

  const valid = /^PPP-[A-Z2-9]{6}$/.test(reference ?? "");
  const booking = valid ? await getBooking(reference) : null;
  const authorised = Boolean(
    booking && token && booking.lookupToken && token === booking.lookupToken
  );

  const payment = authorised ? (booking.payment ?? {}) : null;
  // The stored state is the truth. The hint only fills in for an unrecognised
  // booking, where there is nothing stored to read.
  const state = payment?.state ?? (hint === "paid" ? null : hint);

  const paid = state === "paid" || state === "part-paid";
  /*
   * PayPal has the money but has not released it — an eCheck clearing, or a
   * manual review. Checked BEFORE `failed`, and given its own branch rather
   * than folded into either neighbour, because both neighbours are wrong here:
   * "paid" sends a driver out against money that may never arrive, "failed"
   * invites the guest to pay a second time for the same booking.
   */
  const pending = state === "pending";
  const failed =
    !pending && (state === "failed" || hint === "failed" || hint === "invalid");
  const cancelled = hint === "cancelled";
  const paymentUnconfirmed =
    !pending && (hint === "unconfirmed" || (!authorised && !cancelled));
  const hasPaymentContext = paid || pending || cancelled || failed || hint === "unconfirmed";

  const isEnquiry = authorised && booking.type === "enquiry";
  const isTransfer = authorised && booking.kind === "transfer";
  const quoted = authorised && booking.transportTotal != null;
  const direction =
    authorised &&
    (booking.direction || (booking.tripType === "one-way" ? "to-hotel" : booking.tripType ? "both" : ""));
  const directionLabel =
    isTransfer && direction
      ? tb[direction === "both" ? "roundTrip" : direction === "to-airport" ? "toAirport" : "toHotel"] ??
        describeDirection(direction)
      : null;

  const whatsapp = authorised
    ? buildWhatsAppMessage(booking)
    : `${site.contact.whatsappHref}?text=${encodeURIComponent(
        `Hi PPP Tran Tours, about booking ${reference}: `
      )}`;

  let Icon = FaExclamationTriangle;
  let tone = "text-gold-500";
  let heading;
  let bodyText;

  if (paid) {
    Icon = FaCheckCircle;
    tone = "text-green-600";
    heading = t.paidTitle ?? "Payment received. Thank you.";
    bodyText =
      t.paidBody ??
      "Your booking is confirmed. Your driver and the exact pickup time follow shortly, by WhatsApp or email.";
  } else if (pending) {
    Icon = FaHourglassHalf;
    tone = "text-gold-500";
    heading = t.pendingTitle ?? "Your payment is clearing";
    bodyText =
      t.pendingBody ??
      "PayPal has your payment but hasn't released it yet — this happens with bank transfers and usually clears within a few days. Don't pay again. We'll confirm as soon as it lands, and you'll hear from us about your date either way.";
  } else if (cancelled) {
    Icon = FaTimesCircle;
    tone = "text-ink/70";
    heading = t.cancelledTitle ?? "Payment cancelled";
    bodyText =
      t.cancelledBody ??
      "Nothing was charged, and your booking still stands. You can pay on the day instead, or try again.";
  } else if (failed) {
    Icon = FaTimesCircle;
    tone = "text-crimson-600";
    heading = t.failedTitle ?? "That payment didn't go through";
    bodyText =
      t.failedBody ??
      "Your card was not charged and your booking still stands. You can try again, or simply settle with your driver on the day.";
  } else if (paymentUnconfirmed && (hasPaymentContext || !authorised)) {
    // Either an explicit failed check-in from a payment redirect, or a
    // visit that never authorised at all — a bad link, a wrong or missing
    // token, an unknown reference. Identical neutral copy either way: which
    // check failed is never disclosed.
    heading = t.unconfirmedTitle ?? "We couldn't confirm that payment";
    bodyText =
      t.unconfirmedBody ??
      "Your booking is saved either way. If your card was charged, quote your reference and we'll match it up — nothing is lost.";
  } else {
    // Authorised, with no payment-outcome context at all: the ordinary path
    // now that every booking — cash included — lands here straight from the
    // form, not only ones returning from a payment provider.
    Icon = FaCheckCircle;
    tone = "text-crimson-600";
    heading = isEnquiry
      ? tb.doneEnquiryTitle ?? "We've got your message."
      : quoted
        ? tb.doneTitle ?? "You're booked."
        : tb.doneQuoteTitle ?? "Request received.";
    bodyText = isEnquiry
      ? tb.doneEnquiryBody ?? "We'll reply by email or WhatsApp, usually within the hour."
      : quoted
        ? tb.doneBody ??
          "Your driver and exact pickup time follow by WhatsApp or email shortly."
        : tb.doneQuoteBody ??
          "We'll come back with a firm price, same day, and you can confirm from there.";
  }

  const payableCents = payment?.payableCents ?? 0;
  const collectible = authorised && !paid && payableCents > 0 && paymentsConfigured("USD");

  return (
    <Shell>
      <div className="card p-8 text-center lg:p-10">
        <Icon className={`mx-auto text-4xl ${tone}`} aria-hidden="true" />

        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">
          {heading}
        </h1>

        {valid && (
          <p className="mt-4 text-sm text-ink/60">
            {t.reference ?? "Your reference"}
            <span className="ml-2 rounded-lg bg-sand px-2.5 py-1 font-mono text-sm font-semibold text-ink">
              {reference}
            </span>
          </p>
        )}

        <p className="mt-5 text-[0.95rem] leading-relaxed text-ink/75">{bodyText}</p>

        {/* The booking itself — 08_IMPLEMENTATION_PLAN.md Phase 4: "the page
            shows the full summary (product, hotel, direction, dates, people,
            total, payment state)". Never rendered unless the token checked
            out: this is exactly the guest detail an unauthorised visit must
            not see. */}
        {authorised && (
          <dl className="mt-7 space-y-2 rounded-xl bg-sand px-5 py-4 text-left text-sm">
            <SummaryRow label={isTransfer ? tb.transferTo ?? "Transfer" : tb.total ?? "Tour"}>
              {booking.tourTitle}
            </SummaryRow>
            {directionLabel && (
              <SummaryRow label={tb.direction ?? "Direction"}>{directionLabel}</SummaryRow>
            )}
            {booking.placeLabel && (
              <SummaryRow label={tb.stayingAt ?? "Hotel"}>{booking.placeLabel}</SummaryRow>
            )}
            {booking.date && (
              <SummaryRow label={tb.tourDate ?? "Date"}>
                {booking.date}
                {booking.time ? ` · ${booking.time}` : ""}
              </SummaryRow>
            )}
            {direction === "both" && booking.returnDate && (
              <SummaryRow label={tb.returnDate ?? "Departure date"}>{booking.returnDate}</SummaryRow>
            )}
            <SummaryRow label={tb.sectionParty ?? "Who's coming"}>
              {booking.adults}
              {booking.children > 0 ? ` + ${booking.children}` : ""}
            </SummaryRow>
            {quoted && (
              <SummaryRow label={tb.total ?? "Total"}>
                <span className="font-semibold text-crimson-700">{money(booking.transportTotal)}</span>
              </SummaryRow>
            )}
          </dl>
        )}

        {authorised && paid && payment.paidCents > 0 && (
          <dl className="mt-4 space-y-2 rounded-xl bg-sand px-5 py-4 text-left text-sm">
            <SummaryRow label={t.amountPaid ?? "Paid"}>
              {money(fromCents(payment.paidCents))}
            </SummaryRow>
            {payment.payableCents > payment.paidCents && (
              <SummaryRow label={t.balance ?? "To your driver on the day"}>
                {money(fromCents(payment.payableCents - payment.paidCents))}
              </SummaryRow>
            )}
          </dl>
        )}

        {!authorised && hasPaymentContext && (
          <p className="mt-5 text-xs leading-relaxed text-ink/60">
            {t.unconfirmedNote ??
              "This can happen if the payment page was closed early or your connection dropped. It does not mean the booking was lost."}
          </p>
        )}

        {collectible && (
          <BookingPaymentSection
            reference={booking.reference}
            paymentOptions={{ amountCents: payableCents, amount: payableCents / 100 }}
            paypal={paypalPublicConfig("USD")}
            intent={payment.intent}
            dict={client}
          />
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-primary">
            <FaWhatsapp className="text-base text-whatsapp" />
            {t.whatsapp ?? "Message us on WhatsApp"}
          </a>
          <Link href={localePath(locale, authorised && isTransfer ? "/transfers" : "/")} className="btn-ghost">
            {authorised && isTransfer ? tb.browseTransfers ?? "See all transfer rates" : t.home ?? "Back to home"}
          </Link>
        </div>
      </div>
    </Shell>
  );
}
