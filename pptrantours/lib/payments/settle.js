import {
  findPaymentByProviderRef,
  settlePayment,
  recordForgedAttempt,
  getBooking,
} from "./store";
import { getProvider } from "./index.js";

/**
 * Take an approved PayPal order and decide what it settled to.
 *
 * This used to live inside `/api/payments/paypal/return`, which was the only
 * way a payment could come back. The inline card and PayPal buttons give a
 * second one — the guest approves in a popup and never leaves the site, so
 * there is no redirect to hang the logic off. Two entry points must not mean
 * two implementations of "did this actually get paid": that is precisely the
 * kind of duplication where one copy quietly loses the amount check.
 *
 * So both routes call this, and it owns every assertion:
 *
 * 1. The PayPal order id resolves to a payment WE created, found by the id we
 *    wrote down before the guest left. Nothing is acted on before this, and a
 *    lookup miss is fatal.
 * 2. The payment is still `initiated`. Already terminal means a refresh or a
 *    double-submit: write nothing, report what it already is. This is what
 *    makes settlement idempotent, with `PayPal-Request-Id` on the capture as
 *    the second line behind it.
 * 3. The capture's `custom_id` equals the order id we issued and the captured
 *    amount equals what we asked for — both enforced in paypal.js `capture()`.
 *
 * A thrown capture writes NOTHING and stays `initiated`. A timeout can mean the
 * charge went through and we lost the answer; writing "failed" there is how a
 * real charge gets collected a second time.
 *
 * @param {object} args
 * @param {string} args.paypalOrderId
 * @param {boolean} [args.cancelled]  guest backed out; do not call capture
 * @returns {Promise<{ok:boolean, reference:string|null, token:string|null,
 *   state:string}>}
 */
export async function settlePaypalOrder({ paypalOrderId, cancelled = false }) {
  const miss = (state) => ({ ok: false, reference: null, token: null, state });

  const provider = getProvider("paypal");
  if (!provider) {
    console.error("[payments] settle called with no provider configured");
    return miss("unconfirmed");
  }

  if (!paypalOrderId) {
    console.warn("[payments] settle called with no order id");
    return miss(cancelled ? "cancelled" : "unconfirmed");
  }

  // (1)
  const payment = await findPaymentByProviderRef(paypalOrderId);
  if (!payment) {
    console.warn(`[payments] settle for unknown order ${paypalOrderId}`);
    return miss("unconfirmed");
  }

  const booking = await getBooking(payment.reference);
  const token = booking?.lookupToken ?? null;
  const at = (state) => ({
    ok: state === "paid" || state === "part-paid",
    reference: payment.reference,
    token,
    state,
  });

  // (2) Already terminal — the refresh path. Write nothing.
  if (payment.state !== "initiated") return at(payment.state);

  /*
   * Backed out. Recorded without calling capture: there is nothing to capture,
   * and asking returns ORDER_NOT_APPROVED, which would be logged as a failure
   * it is not.
   */
  if (cancelled) {
    await settlePayment({
      paymentId: payment.id,
      outcome: "cancelled",
      providerTxnId: null,
      providerStatus: "CANCELLED_BY_PAYER",
      hashVerified: false,
      returnPayload: null,
    }).catch((err) =>
      console.error(`[payments] ${payment.reference} cancel not recorded`, err)
    );
    return at("cancelled");
  }

  // (3) The charge, and every assertion about it.
  let verdict;
  try {
    verdict = await provider.capture({
      paypalOrderId,
      expectedCustomId: payment.orderId,
      expectedCents: payment.amountCents,
      currency: payment.currency,
    });
  } catch (err) {
    console.error(
      `[payments] ${payment.reference} capture threw for ${paypalOrderId}`,
      err
    );
    return at("unconfirmed");
  }

  if (verdict.outcome === "invalid") {
    console.error(
      `[payments] ${payment.reference} capture failed verification: ${verdict.message}`
    );
    await recordForgedAttempt(payment.id);
    return at("unconfirmed");
  }

  try {
    const { alreadySettled } = await settlePayment({
      paymentId: payment.id,
      outcome: verdict.outcome,
      providerTxnId: verdict.transactionId,
      providerStatus: verdict.providerStatus,
      // Named for WiPay's md5, kept because the column means "the provider's
      // own proof checked out" and PayPal's proof is the authenticated capture.
      hashVerified: verdict.verified,
      returnPayload: verdict.raw,
    });

    if (!alreadySettled) {
      console.log(
        `[payments] ${payment.reference} ${verdict.outcome} (${verdict.transactionId ?? "no txn"})`
      );
    }
  } catch (err) {
    console.error(`[payments] ${payment.reference} could not be settled`, err);
    return at("unconfirmed");
  }

  return at(verdict.outcome);
}
