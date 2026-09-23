"use client";

import { useState } from "react";
import { FaCreditCard, FaLock, FaSpinner } from "react-icons/fa";
import { money } from "@/app/products/pricing";
import { startPayment } from "@/lib/bookings";
import PayPalCheckout from "../PayPalCheckout";

/**
 * The interactive "pay now" retry on a booking's own page — split out from
 * the page itself only because it needs client interactivity (PayPal's SDK,
 * `useState` for the in-flight states); everything else on that page is
 * static per request and stays server-rendered.
 *
 * Shown whenever a booking is still payable: a guest who chose cash can
 * change their mind from here, and a guest whose card attempt failed or
 * whose hosted-checkout redirect never landed gets a second try, without
 * either case needing its own page.
 */
export default function BookingPaymentSection({ reference, paymentOptions, paypal, intent, dict }) {
  const t = dict?.booking ?? {};
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [sdkDown, setSdkDown] = useState(false);
  const [settled, setSettled] = useState(null);

  const useButtons = Boolean(paypal?.clientId) && !sdkDown && !settled?.ok;

  const goToPayment = async () => {
    setPaying(true);
    setPayError("");
    try {
      const url = await startPayment(reference);
      window.location.assign(url);
    } catch (err) {
      console.error("Payment could not start", err);
      setPaying(false);
      setPayError(
        t.payStartFailed ??
          "We couldn't open the payment page. Your booking is safe — you can pay your driver on the day, or message us."
      );
    }
  };

  if (settled?.ok) {
    return (
      <div
        role="status"
        className="mt-4 rounded-lg bg-green-50 px-3 py-2.5 text-xs leading-relaxed text-green-800"
      >
        {t.payDone ?? "Payment received. Thank you — you're all set."}
      </div>
    );
  }

  return (
    <div className="mt-7 rounded-xl bg-sand px-5 py-5">
      <p className="text-sm font-semibold text-ink">
        {intent === "card" ? t.payFinish ?? "Finish your payment" : t.payHow ?? "Want to pay now instead?"}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink/60">
        {t.payOptional ??
          "Paying now is optional and changes nothing about your booking. You can always settle with your driver, in cash."}
      </p>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{money(paymentOptions.amount)}</p>

      {useButtons ? (
        <div className="mt-4 text-left">
          <PayPalCheckout
            clientId={paypal.clientId}
            currency={paypal.currency}
            reference={reference}
            dict={dict}
            onFallback={() => setSdkDown(true)}
            onSettled={setSettled}
          />
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={goToPayment}
            disabled={paying}
            className="btn-primary mt-4 w-full disabled:opacity-60"
          >
            {paying ? (
              <>
                <FaSpinner className="animate-spin" />
                {t.payRedirecting ?? "Opening secure payment…"}
              </>
            ) : (
              <>
                <FaCreditCard className="text-base" />
                {(t.payNow ?? "Pay {amount} by card now").replace("{amount}", money(paymentOptions.amount))}
              </>
            )}
          </button>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink/60">
            <FaLock className="text-[0.6rem]" />
            {t.paySecureNote ??
              "Card details are entered on our payment provider's own page and never touch this site."}
          </p>
        </>
      )}

      {settled && !settled.ok && (
        <div
          role="status"
          className="mt-4 rounded-lg bg-gold-200/40 px-3 py-2.5 text-xs leading-relaxed text-ink/70"
        >
          {settled.state === "cancelled"
            ? t.payCancelled ?? "Payment cancelled — nothing was charged. Your booking still stands."
            : settled.state === "pending"
              ? t.payPending ?? "Your payment is clearing. Don't pay again — we'll confirm by email."
              : t.payUnsure ??
                "We couldn't confirm that payment. Nothing may have been charged — message us before trying again."}
        </div>
      )}

      {payError && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {payError}
        </p>
      )}
    </div>
  );
}
