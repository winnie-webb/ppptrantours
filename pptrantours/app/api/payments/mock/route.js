import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A stand-in for WiPay's hosted page. Development only.
 *
 * `response_url` cannot be localhost as far as WiPay is concerned, so exercising
 * the real return route otherwise needs a tunnel. This serves four buttons
 * instead, each of which redirects to the REAL return route:
 *
 *   Pay        a correctly computed hash — settles as paid
 *   Decline    status=failed, no hash — must be handled, not treated as fraud
 *   Cancel     status=cancelled
 *   Forge      status=success with a garbage hash — must be rejected
 *   Underpay   status=success, valid hash, but total=1.00 — must be rejected by
 *              the amount check, which is the check implementations skip
 *
 * The last two are the point of this page. Reaching them through a tunnel and a
 * live sandbox card is tedious; reaching them here is one click.
 *
 * Guarded on PAYMENTS_MOCK plus a non-production NODE_ENV, and
 * lib/payments/index.js refuses to select the mock provider in production
 * regardless. This route returns 404 outside development so it does not even
 * advertise its existence.
 */
function enabled() {
  return process.env.PAYMENTS_MOCK === "1" && process.env.NODE_ENV !== "production";
}

const md5 = (s) => crypto.createHash("md5").update(s, "utf8").digest("hex");

export async function GET(request) {
  if (!enabled()) return new NextResponse("Not found", { status: 404 });

  const q = request.nextUrl.searchParams;
  const orderId = q.get("order_id") ?? "";
  const total = q.get("total") ?? "0.00";
  const currency = q.get("currency") ?? "USD";
  const returnUrl = q.get("return_url") ?? "";
  const apiKey = process.env.WIPAY_API_KEY || "123";

  const txn = `MOCK-${Date.now()}`;

  const link = (label, params, tone) => {
    const url = new URL(returnUrl);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return `<a class="${tone}" href="${url.toString()}">${label}</a>`;
  };

  const buttons = [
    link(
      "Pay — valid hash",
      {
        status: "success",
        transaction_id: txn,
        order_id: orderId,
        total,
        hash: md5(`${txn}${total}${apiKey}`),
        message: "[1-R1]: Transaction is approved.",
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
        message: "[1-R2]: Transaction is declined.",
      },
      "warn"
    ),
    link("Cancel", { status: "cancelled", order_id: orderId }, "warn"),
    link(
      "Forge — garbage hash",
      {
        status: "success",
        transaction_id: txn,
        order_id: orderId,
        total,
        hash: "0".repeat(32),
      },
      "bad"
    ),
    /*
     * The real attack, and the only one the hash cannot stop.
     *
     * WiPay computes its digest over the total from the ORIGINAL request, so an
     * attacker who edits `total` in the redirect leaves the hash still valid.
     * Keeping the genuine hash here and reporting a lower total is therefore
     * exactly what a tampered return looks like — and the amount check in the
     * return route is the only thing standing between it and a $40 booking
     * settled for $1.
     *
     * An earlier version of this button recomputed the hash over 1.00, which
     * made it fail at the hash check and quietly never tested the amount check
     * at all.
     */
    link(
      "Tamper — genuine hash, reported total cut to $1.00",
      {
        status: "success",
        transaction_id: txn,
        order_id: orderId,
        total: "1.00",
        hash: md5(`${txn}${total}${apiKey}`),
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
  <p class="muted">Development stand-in for WiPay's hosted page. This is not a real payment.</p>
  <dl>
    <dt>order_id</dt><dd>${orderId}</dd>
    <dt>total</dt><dd>${total} ${currency}</dd>
    <dt>transaction_id</dt><dd>${txn}</dd>
  </dl>
  ${buttons}
  <p class="note">The bottom two must both be <strong>rejected</strong>. The last
  one is the attack that matters: WiPay hashes the total from the original
  request, so editing <code>total</code> in the redirect leaves the hash valid.
  Only the amount check stops that settling the full booking for $1.</p>
</main>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
