import Link from "next/link";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaWhatsapp,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import { site } from "@/app/data/site";
import { fromCents, money } from "@/app/products/pricing";
import { getBooking } from "@/lib/payments/store";
import { localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";

export const dynamic = "force-dynamic";

/**
 * Where a guest lands after the hosted payment page.
 *
 * State is read from Firestore, NEVER from the query string. `?state=` is only
 * a hint for the copy while the write settles — anyone can edit it, so it can
 * never be what decides whether the page says "paid".
 *
 * `?p=` is the booking's `lookupToken`. Without it the page shows the outcome
 * but no booking detail: a six-character reference from a 32-letter alphabet is
 * not enough protection for a guest's name and travel dates.
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

export default async function BookingResultPage({ params, searchParams }) {
  const { locale, reference } = await params;
  const query = await searchParams;
  const dict = await getDictionary(locale);
  const t = dict.bookingResult ?? {};

  const token = typeof query?.p === "string" ? query.p : null;
  const hint = typeof query?.state === "string" ? query.state : null;

  const valid = /^PPP-[A-Z2-9]{6}$/.test(reference ?? "");
  const booking = valid ? await getBooking(reference) : null;
  const authorised =
    booking && token && booking.lookupToken && token === booking.lookupToken;

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
  const unconfirmed =
    !pending && (hint === "unconfirmed" || (!authorised && !cancelled));

  const whatsapp = `${site.contact.whatsappHref}?text=${encodeURIComponent(
    `Hi PPP Tran Tours, about booking ${reference}: `
  )}`;

  let Icon = FaExclamationTriangle;
  let tone = "text-gold-500";
  let heading = t.unconfirmedTitle ?? "We couldn't confirm that payment";
  let bodyText =
    t.unconfirmedBody ??
    "Your booking is saved either way. If your card was charged, quote your reference and we'll match it up — nothing is lost.";

  if (paid) {
    Icon = FaCheckCircle;
    tone = "text-green-600";
    heading = t.paidTitle ?? "Payment received. Thank you.";
    bodyText =
      t.paidBody ??
      "We still confirm availability for your date, and if we cannot take it you are refunded in full. You'll hear from us shortly.";
  } else if (pending) {
    Icon = FaHourglassHalf;
    tone = "text-gold-500";
    heading = t.pendingTitle ?? "Your payment is clearing";
    bodyText =
      t.pendingBody ??
      "PayPal has your payment but hasn't released it yet — this happens with bank transfers and usually clears within a few days. Don't pay again. We'll confirm as soon as it lands, and you'll hear from us about your date either way.";
  } else if (cancelled) {
    Icon = FaTimesCircle;
    tone = "text-ink/40";
    heading = t.cancelledTitle ?? "Payment cancelled";
    bodyText =
      t.cancelledBody ??
      "Nothing was charged, and your booking request is still with us. You can pay on the day instead, or try again.";
  } else if (failed) {
    Icon = FaTimesCircle;
    tone = "text-crimson-600";
    heading = t.failedTitle ?? "That payment didn't go through";
    bodyText =
      t.failedBody ??
      "Your card was not charged and your booking request is still with us. You can try again, or simply settle with your driver on the day.";
  }

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

        <p className="mt-5 text-[0.95rem] leading-relaxed text-ink/75">
          {bodyText}
        </p>

        {authorised && paid && payment.paidCents > 0 && (
          <dl className="mt-7 space-y-2 rounded-xl bg-sand px-5 py-4 text-left text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">{t.amountPaid ?? "Paid"}</dt>
              <dd className="font-semibold text-ink">
                {money(fromCents(payment.paidCents))}
              </dd>
            </div>
            {payment.payableCents > payment.paidCents && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">
                  {t.balance ?? "To your driver on the day"}
                </dt>
                <dd className="font-semibold text-ink">
                  {money(fromCents(payment.payableCents - payment.paidCents))}
                </dd>
              </div>
            )}
          </dl>
        )}

        {unconfirmed && (
          <p className="mt-5 text-xs leading-relaxed text-ink/60">
            {t.unconfirmedNote ??
              "This can happen if the payment page was closed early or your connection dropped. It does not mean the booking was lost."}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <FaWhatsapp className="text-base" />
            {t.whatsapp ?? "Message us on WhatsApp"}
          </a>
          <Link href={localePath(locale, "/")} className="btn-ghost">
            {t.home ?? "Back to home"}
          </Link>
        </div>
      </div>
    </Shell>
  );
}
