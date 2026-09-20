import { NextResponse } from "next/server";
import { sign } from "@/lib/payments/mock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A stand-in for a hosted payment page. Development only.
 *
 * Six buttons, each redirecting to the mock's own return route at
 * `/api/payments/mock/return`, which writes through the SAME `settlePayment`
 * the PayPal route uses. So the store, the settlement transaction, the booking
 * summary and the result page are all exercised for real:
 *
 *   Pay        correctly signed, correct total — settles as paid
 *   Decline    status=failed — must be handled, not treated as fraud
 *   Cancel     status=cancelled
 *   Pending    status=pending — must show as pending, not paid and not failed
 *   Forge      status=success with a garbage signature — must be rejected
 *   Tamper     status=success, genuine signature, total cut to $1.00 — must be
 *              rejected by the amount check, which is the check that gets
 *              skipped
 *
 * The last two are the point of this page. Reaching them against a real
 * provider is tedious; reaching them here is one click.
 *
 * Guarded on PAYMENTS_MOCK plus a non-production NODE_ENV, and
 * lib/payments/index.js refuses to select the mock provider in production
 * regardless. This route returns 404 outside development so it does not even
 * advertise its existence.
 */
function enabled() {
  return process.env.PAYMENTS_MOCK === "1" && process.env.NODE_ENV !== "production";
}

/** Reflected values are our own, but this page is not the place to find out. */
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

export async function GET(request) {
  if (!enabled()) return new NextResponse("Not found", { status: 404 });

  const q = request.nextUrl.searchParams;
  const orderId = q.get("order_id") ?? "";
  const total = q.get("total") ?? "0.00";
  const currency = q.get("currency") ?? "USD";
  const returnUrl = q.get("return_url") ?? "";

  const txn = `MOCK-${Date.now()}`;
  const good = sign({ orderId, total });

  const link = (label, params, tone) => {
    const url = new URL(returnUrl, request.nextUrl.origin);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return `<a class="${tone}" href="${esc(url.toString())}">${esc(label)}</a>`;
  };

  const buttons = [
    link(
      "Pay — correctly signed",
      {
        status: "success",
        transaction_id: txn,
        order_id: orderId,
        total,
        sig: good,
        message: "Transaction is approved.",
      },
      "ok"
    ),
    link(
      "Decline",
      {
        status: "failed",
        transaction_id: txn,
        order_id: orderId,
        total,
        message: "Transaction is declined.",
      },
      "warn"
    ),
    link("Cancel", { status: "cancelled", order_id: orderId }, "warn"),
    /*
     * PayPal returns PENDING when it holds the money without releasing it — an
     * eCheck clearing, or a manual review. Neither "paid" nor "failed" is a
     * true answer, and this button is here because the temptation to collapse
     * it into one of them is strongest when it has never been seen.
     */
    link(
      "Pending — PayPal is holding it",
      {
        status: "pending",
        transaction_id: txn,
        order_id: orderId,
        total,
        sig: good,
        message: "PENDING:ECHECK",
      },
      "warn"
    ),
    link(
      "Forge — garbage signature",
      {
        status: "success",
        transaction_id: txn,
        order_id: orderId,
        total,
        sig: "0".repeat(64),
      },
      "bad"
    ),
    /*
     * The attack a signature alone does not stop.
     *
     * The signature covers the total from the ORIGINAL request, so an attacker
     * who edits the reported total in the redirect leaves it still valid.
     * Keeping the genuine signature here and reporting a lower total is exactly
     * what a tampered return looks like — and the amount comparison is the only
     * thing standing between it and a $340 booking settled for $1.
     *
     * An earlier version of this button re-signed over 1.00, which made it fail
     * at the signature check and quietly never test the amount check at all.
     */
    link(
      "Tamper — genuine signature, reported total cut to $1.00",
      {
        status: "success",
        transaction_id: txn,
        order_id: orderId,
        total: "1.00",
        sig: good,
      },
      "bad"
    ),
  ].join("\n");

  const html = `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mock payment page</title>
<style>
  body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:2.5rem 1.25rem;background:#fbf7f4;color:#150a0d}
  main{max-width:34rem;margin:0 auto}
  h1{font-size:1.25rem;margin:0 0 .25rem}
  .muted{color:#150a0d99;font-size:.85rem}
  dl{display:grid;grid-template-columns:auto 1fr;gap:.35rem 1rem;margin:1.5rem 0;font-size:.9rem}
  dt{color:#150a0d99}
  dd{margin:0;font-family:ui-monospace,monospace}
  a{display:block;padding:.75rem 1rem;margin:.5rem 0;border-radius:.6rem;text-decoration:none;font-weight:600;color:#fff}
  .ok{background:#137a4a}.warn{background:#8a6d1f}.bad{background:#a80424}
  .note{margin-top:1.5rem;padding:.85rem 1rem;background:#f1d72d40;border-radius:.6rem;font-size:.85rem}
</style>
<main>
  <h1>Mock payment page</h1>
  <p class="muted">Development stand-in for a hosted payment page. This is not a real payment, and it does not exercise lib/payments/paypal.js — use the PayPal sandbox for that.</p>
  <dl>
    <dt>order_id</dt><dd>${esc(orderId)}</dd>
    <dt>total</dt><dd>${esc(total)} ${esc(currency)}</dd>
    <dt>transaction_id</dt><dd>${esc(txn)}</dd>
  </dl>
  ${buttons}
  <p class="note">The bottom two must both be <strong>rejected</strong>. The last
  one is the attack that matters: the signature covers the total from the
  original request, so editing the reported total leaves it valid. Only the
  amount check stops that settling the full booking for $1.</p>
</main>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
