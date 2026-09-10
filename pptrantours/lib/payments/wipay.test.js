/**
 * Run with: npm test
 *
 * `node --test` is built into Node 22, so this needs no dependency and there is
 * no test framework to keep current. It exists for one reason: the hash check is
 * the only thing standing between the payment flow and a forged "paid" booking,
 * and it is pure, so it can be pinned to a known answer.
 *
 * The known answer is WiPay's own. Their Payments API Documentation v1.0.8
 * prints a worked example whose response carries
 * hash 3d34d20260f7433ceee277e9ed9166a3 for
 * transaction_id SB-12-1-oid_123-aBc-20210616024001. Reproducing that digest
 * proves three things at once:
 *
 *   1. the concatenation order is transaction_id + total + api_key,
 *   2. there are no separators,
 *   3. the total hashed is the one we REQUESTED (10.00), not the one WiPay
 *      returned (12.05, after adding its fee under customer_pay).
 *
 * Point 3 is the one that matters. An implementation that hashes the returned
 * total passes under merchant_absorb by luck and fails the day the fee
 * structure changes.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyHash, settle, supportsCurrency } from "./wipay.js";

const TXN = "SB-12-1-oid_123-aBc-20210616024001";
const DOC_HASH = "3d34d20260f7433ceee277e9ed9166a3";
const SANDBOX_KEY = "123";
const REQUESTED = "10.00";
const RETURNED = "12.05";

test("reproduces the hash from WiPay's own documented example", () => {
  assert.ok(
    verifyHash({
      transactionId: TXN,
      total: REQUESTED,
      hash: DOC_HASH,
      apiKey: SANDBOX_KEY,
    })
  );
});

test("the digest covers the requested total, not the returned one", () => {
  assert.ok(
    !verifyHash({
      transactionId: TXN,
      total: RETURNED,
      hash: DOC_HASH,
      apiKey: SANDBOX_KEY,
    }),
    "hashing the fee-inclusive total must not validate"
  );
});

test("total is hashed byte for byte, so 10 is not 10.00", () => {
  for (const bad of ["10", "10.0", " 10.00", "1000"]) {
    assert.ok(
      !verifyHash({
        transactionId: TXN,
        total: bad,
        hash: DOC_HASH,
        apiKey: SANDBOX_KEY,
      }),
      `"${bad}" must not validate against the digest for "10.00"`
    );
  }
});

test("a wrong key, a wrong txn id, or a garbage hash all fail", () => {
  const base = { transactionId: TXN, total: REQUESTED, hash: DOC_HASH };
  assert.ok(!verifyHash({ ...base, apiKey: "124" }));
  assert.ok(!verifyHash({ ...base, transactionId: `${TXN}x`, apiKey: SANDBOX_KEY }));
  assert.ok(
    !verifyHash({ ...base, hash: "deadbeef".repeat(4), apiKey: SANDBOX_KEY })
  );
  // Length mismatch must return false, not throw out of timingSafeEqual.
  assert.doesNotThrow(() =>
    verifyHash({ ...base, hash: "abc", apiKey: SANDBOX_KEY })
  );
  assert.ok(!verifyHash({ ...base, hash: "abc", apiKey: SANDBOX_KEY }));
});

test("missing pieces fail closed rather than throwing", () => {
  assert.ok(!verifyHash({}));
  assert.ok(!verifyHash({ transactionId: TXN, total: null, hash: DOC_HASH }));
  assert.ok(!verifyHash({ transactionId: TXN, total: REQUESTED, hash: "" }));
});

/*
 * settle() reads a redirect. WIPAY_API_KEY is unset under the test runner, so
 * the sandbox fallback key 123 applies — the same key the documented example
 * used, which is why the doc's own hash validates here.
 */
const query = (o) => new URLSearchParams(o);

test("a well-formed success settles as paid", () => {
  const r = settle(
    query({
      status: "success",
      transaction_id: TXN,
      order_id: "PPP-K3F9QX-1",
      total: RETURNED,
      hash: DOC_HASH,
      message: "[1-R1]: Transaction is approved.",
    }),
    REQUESTED
  );
  assert.equal(r.outcome, "paid");
  assert.equal(r.verified, true);
  assert.equal(r.orderId, "PPP-K3F9QX-1");
  assert.equal(r.reportedTotal, RETURNED);
});

test("a success with a forged hash settles as invalid, never paid", () => {
  const r = settle(
    query({
      status: "success",
      transaction_id: TXN,
      order_id: "PPP-K3F9QX-1",
      total: "1.00",
      hash: "0".repeat(32),
    }),
    REQUESTED
  );
  assert.equal(r.outcome, "invalid");
  assert.equal(r.verified, false);
});

test("a decline carries no hash and is not treated as tampering", () => {
  const r = settle(
    query({
      status: "failed",
      transaction_id: TXN,
      order_id: "PPP-K3F9QX-1",
      message: "[1-R2]: Transaction is declined.",
    }),
    REQUESTED
  );
  assert.equal(r.outcome, "failed");
  assert.equal(r.verified, false);
});

test("a cancellation is distinguished from a decline", () => {
  const r = settle(
    query({ status: "cancelled", order_id: "PPP-K3F9QX-1" }),
    REQUESTED
  );
  assert.equal(r.outcome, "cancelled");
});

test("the audit payload keeps the query but drops the hash", () => {
  const r = settle(
    query({
      status: "success",
      transaction_id: TXN,
      order_id: "PPP-K3F9QX-1",
      total: RETURNED,
      hash: DOC_HASH,
    }),
    REQUESTED
  );
  assert.equal(r.raw.hash, undefined);
  assert.equal(r.raw.transaction_id, TXN);
});

test("WiPay Jamaica settles USD/JMD/TTD and nothing else", () => {
  for (const c of ["USD", "JMD", "TTD"]) assert.ok(supportsCurrency(c));
  for (const c of ["CAD", "GBP", "EUR"]) assert.ok(!supportsCurrency(c));
});
