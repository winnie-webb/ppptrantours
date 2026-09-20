import { NextResponse } from "next/server";
import { settlePaypalOrder } from "@/lib/payments/settle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Settle an order the guest approved in the inline buttons, without a redirect.
 *
 * The SDK hands `onApprove` a PayPal order id and expects the merchant's own
 * server to capture it — capturing in the browser would put the decision about
 * whether money was taken on the client, which is exactly the flaw that makes
 * islandwaystours' checkout unsafe. Nothing here is trusted from the body
 * except the order id, and that is only a lookup key: it resolves to a payment
 * record WE wrote before the guest ever saw PayPal, and every amount comes from
 * that record.
 *
 * So an attacker posting a random or someone else's order id gets the same
 * thing a typo gets: no matching payment, `unconfirmed`, nothing written.
 *
 * All the real work — and all the assertions — are in lib/payments/settle.js,
 * shared with the redirect return route.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Malformed request." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // PayPal order ids are of the form 5O190127TN364715T. Bounded and shaped
  // before it reaches a lookup, so a hostile body cannot become a long scan.
  const paypalOrderId = String(body.orderID ?? "").trim().slice(0, 40);
  if (!/^[A-Z0-9]{5,40}$/i.test(paypalOrderId)) {
    return NextResponse.json(
      { error: "That payment could not be identified." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const cancelled = body.cancelled === true;

  const { ok, reference, token, state } = await settlePaypalOrder({
    paypalOrderId,
    cancelled,
  });

  /*
   * 200 even when the outcome is not "paid". The states below are real answers
   * about a real payment — cancelled, pending with an eCheck, unconfirmed after
   * an ambiguous capture — and the client renders each differently. An HTTP
   * error would collapse them into "something broke" and tempt a retry of a
   * charge that may have gone through.
   */
  return NextResponse.json(
    {
      ok,
      state,
      reference,
      // Lets the client link straight to the result page, which is otherwise
      // only reachable from the redirect flow.
      resultPath: reference
        ? `/booking/${reference}${token ? `?p=${encodeURIComponent(token)}&state=${state}` : `?state=${state}`}`
        : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
