import { NextResponse } from "next/server";
import { site } from "@/app/data/site";
import { getProvider } from "@/lib/payments";
import {
  findPaymentByProviderRef,
  settlePayment,
  recordForgedAttempt,
  getBooking,
} from "@/lib/payments/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The mock provider's return route. Development only.
 *
 * Deliberately a near-copy of the PayPal route's guards rather than a shared
 * helper. The two are the same shape today and there is a real temptation to
 * factor them together, but the duplication is the cheaper mistake: a shared
 * return handler is one edit away from letting the mock's verdicts through the
 * path a real payment takes, and this file's whole reason for existing is that
 * it can never be reached in production.
 *
 * 404s outside development, on top of the provider gate in lib/payments.
 */

function resultUrl({ reference, token, state }) {
  const params = new URLSearchParams({ state });
  if (token) params.set("p", token);
  return `${site.url}/booking/${reference}?${params.toString()}`;
}

export async function GET(request) {
  const provider = getProvider("mock");
  if (!provider) return new NextResponse("Not found", { status: 404 });

  const params = request.nextUrl.searchParams;
  const orderId = params.get("order_id");
  if (!orderId) return new NextResponse("Missing order_id", { status: 400 });

  // `start()` records the mock's providerRef as MOCK-<orderId>, so the lookup
  // is identical in shape to the PayPal one.
  const payment = await findPaymentByProviderRef(`MOCK-${orderId}`);
  if (!payment) {
    console.warn(`[payments] mock return for unknown order ${orderId}`);
    return NextResponse.redirect(`${site.url}/booking/unknown?state=unconfirmed`, 303);
  }

  const booking = await getBooking(payment.reference);
  const token = booking?.lookupToken ?? null;

  if (payment.state !== "initiated") {
    return NextResponse.redirect(
      resultUrl({ reference: payment.reference, token, state: payment.state }),
      303
    );
  }

  // The requested total comes from our record, never the query string. The
  // "Tamper" button exists to prove that.
  const verdict = provider.settle(params, payment.requestedTotal);

  if (verdict.outcome === "invalid") {
    console.error(
      `[payments] ${payment.reference} mock return rejected: ${verdict.reportedTotal} vs ${payment.requestedTotal}`
    );
    await recordForgedAttempt(payment.id);
    return NextResponse.redirect(
      resultUrl({ reference: payment.reference, token, state: "unconfirmed" }),
      303
    );
  }

  await settlePayment({
    paymentId: payment.id,
    outcome: verdict.outcome,
    providerTxnId: verdict.transactionId,
    providerStatus: verdict.providerStatus,
    hashVerified: verdict.verified,
    returnPayload: verdict.raw,
  });

  console.log(`[payments] ${payment.reference} ${verdict.outcome} (mock)`);

  return NextResponse.redirect(
    resultUrl({ reference: payment.reference, token, state: verdict.outcome }),
    303
  );
}
