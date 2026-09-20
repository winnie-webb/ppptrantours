"use client";

import { useEffect, useRef, useState } from "react";
import { FaSpinner, FaLock, FaExclamationTriangle } from "react-icons/fa";
import { createPaymentSession, capturePayment } from "@/lib/bookings";

/**
 * Pay here, with a card, without a PayPal account.
 *
 * The old flow sent the guest to paypal.com and hoped. Most people booking a
 * Jamaican airport transfer do not have a PayPal account, and a full-page
 * redirect to a login screen is where they stop — so this renders PayPal's own
 * buttons inline, with the card button beside them. The card button opens
 * PayPal's guest card form in a popup: no account, no redirect, and the guest
 * can still see our page behind it.
 *
 * ── What stays on the server, and why it must ──────────────────────────────
 *
 * `createOrder` does NOT create an order in the browser. It asks
 * /api/payments/start, which re-derives the amount from the stored booking and
 * writes a payment record before returning PayPal's order id. `onApprove` does
 * NOT capture in the browser either — it posts the order id to our own capture
 * route, which verifies custom_id and the exact amount against that record
 * before taking anything.
 *
 * This is the whole difference between this and islandwaystours' checkout,
 * where the amount comes out of a URL and the browser both creates and
 * captures. There, a guest can pay $1 for a $200 tour and be told "Payment
 * received". Nothing in this component is allowed to drift toward that: if you
 * are ever tempted to pass an amount from here, the answer is no.
 *
 * ── Failure ────────────────────────────────────────────────────────────────
 *
 * The SDK is a third-party script and ad blockers eat it. If it will not load,
 * or the buttons error, this hands back to `onFallback` so the caller can show
 * the hosted-page redirect that has always worked.
 */

const SDK_ID = "paypal-sdk";

function loadSdk({ clientId, currency }) {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.paypal?.Buttons) return Promise.resolve(window.paypal);

  const existing = document.getElementById(SDK_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.paypal));
      existing.addEventListener("error", () => reject(new Error("sdk-failed")));
      // Already finished before we attached, and window.paypal never appeared.
      if (existing.dataset.failed === "1") reject(new Error("sdk-failed"));
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.id = SDK_ID;
    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      components: "buttons",
      // The reason this component exists: a standalone Debit/Credit Card
      // button for guests with no PayPal account.
      "enable-funding": "card",
      // Two clear ways to pay beats six. Pay Later and Venmo are US-market
      // funding sources that would sit above the card button for guests who
      // cannot use either.
      "disable-funding": "paylater,venmo",
    });
    s.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    s.async = true;
    s.onload = () =>
      window.paypal?.Buttons
        ? resolve(window.paypal)
        : reject(new Error("sdk-failed"));
    s.onerror = () => {
      s.dataset.failed = "1";
      reject(new Error("sdk-failed"));
    };
    document.body.appendChild(s);
  });
}

export default function PayPalCheckout({
  clientId,
  currency = "USD",
  reference,
  dict,
  onSettled,
  onFallback,
}) {
  const t = dict?.booking ?? {};
  const holder = useRef(null);
  const [state, setState] = useState("loading"); // loading | ready | busy | failed
  const [message, setMessage] = useState("");

  /*
   * The callbacks are read through refs inside the PayPal closures rather than
   * captured. PayPal renders the buttons into an iframe once; re-rendering
   * them on every parent state change would tear down and rebuild a payment
   * surface mid-transaction, and stale closures would settle against the wrong
   * handler.
   */
  const cbs = useRef({ onSettled, onFallback, reference });
  // Updated after each render rather than during it: the buttons hold these
  // for the life of the iframe, so they must always be the latest, but a ref
  // written mid-render is a React rule violation and an easy source of
  // torn state.
  useEffect(() => {
    cbs.current = { onSettled, onFallback, reference };
  });

  useEffect(() => {
    let cancelled = false;
    let instance;

    loadSdk({ clientId, currency })
      .then((paypal) => {
        if (cancelled || !holder.current) return;

        instance = paypal.Buttons({
          style: { layout: "vertical", shape: "rect", height: 46, label: "pay" },

          // Server-created. No amount crosses from here.
          createOrder: async () => {
            const { providerRef } = await createPaymentSession(
              cbs.current.reference
            );
            if (!providerRef) throw new Error("no-order");
            return providerRef;
          },

          // Server-captured, and the server re-checks the amount.
          onApprove: async (data) => {
            setState("busy");
            try {
              const result = await capturePayment(data.orderID);
              /*
               * "done" before handing the result up, and "done" renders
               * nothing.
               *
               * This used to leave the state on "busy", so "Confirming your
               * payment…" sat under the parent's "Payment received" — the page
               * telling the guest both that it was still working and that it
               * had finished. It also left the buttons mounted after a
               * successful capture, which invites a second payment for a
               * booking already paid.
               */
              setState("done");
              cbs.current.onSettled?.(result);
            } catch (err) {
              console.error("[paypal] capture failed", err);
              setState("failed");
              setMessage(
                t.payCaptureFailed ??
                  "We couldn't confirm that payment. Don't try again yet — message us and we'll check before anything is charged twice."
              );
            }
          },

          onCancel: async (data) => {
            // Recorded, so the attempt does not sit "initiated" until the
            // abandonment sweep retires it.
            try {
              const result = await capturePayment(data.orderID, {
                cancelled: true,
              });
              cbs.current.onSettled?.(result);
            } catch {
              setState("ready");
            }
          },

          onError: (err) => {
            console.error("[paypal] buttons error", err);
            setState("failed");
            setMessage(
              t.payButtonsFailed ??
                "The payment buttons couldn't load. You can still pay on our secure payment page."
            );
            cbs.current.onFallback?.();
          },
        });

        if (!instance.isEligible?.()) {
          setState("failed");
          cbs.current.onFallback?.();
          return;
        }

        instance.render(holder.current).then(
          () => !cancelled && setState("ready"),
          () => {
            if (cancelled) return;
            setState("failed");
            cbs.current.onFallback?.();
          }
        );
      })
      .catch(() => {
        if (cancelled) return;
        setState("failed");
        cbs.current.onFallback?.();
      });

    return () => {
      cancelled = true;
      try {
        instance?.close?.();
      } catch {
        /* the iframe is already gone */
      }
    };
    // clientId and currency are build-time constants; the callbacks live in a
    // ref precisely so this never re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, currency]);

  // Settled. The parent owns what the guest sees now, and leaving the buttons
  // up would offer a second payment for a booking that is already paid.
  if (state === "done") return null;

  if (state === "failed") {
    return message ? (
      <p className="flex items-start gap-2 rounded-lg bg-gold-200/40 px-3 py-2 text-xs leading-relaxed text-ink/70">
        <FaExclamationTriangle className="mt-0.5 shrink-0 text-gold-600" />
        {message}
      </p>
    ) : null;
  }

  return (
    <div>
      {state === "loading" && (
        <p className="flex items-center justify-center gap-2 py-3 text-xs text-ink/50">
          <FaSpinner className="animate-spin" />
          {t.payLoading ?? "Loading secure payment…"}
        </p>
      )}

      {/* PayPal owns everything inside this node. */}
      <div ref={holder} />

      {state === "busy" && (
        <p className="flex items-center justify-center gap-2 pt-3 text-xs text-ink/60">
          <FaSpinner className="animate-spin" />
          {t.payConfirming ?? "Confirming your payment…"}
        </p>
      )}

      {state === "ready" && (
        <p className="mt-3 flex items-center justify-center gap-2 text-center text-[0.7rem] leading-relaxed text-ink/60">
          <FaLock className="shrink-0 text-[0.6rem]" />
          {t.payCardNote ??
            "Card or PayPal — no account needed. Your card details go straight to PayPal and never touch this site."}
        </p>
      )}
    </div>
  );
}
