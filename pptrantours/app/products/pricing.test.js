import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getPlace } from "../data/places.js";
import {
  priceTransfer,
  quoteTransfer,
  describeDirection,
  DIRECTIONS,
  billedPax,
  money,
  MIN_BILLED_PAX,
} from "./pricing.js";

// A real place with a known, asymmetric one-way/round-trip rate, so a test
// that mixes them up fails loudly.
const PLACE = getPlace("toby-resort");
const { oneWay, roundTrip } = PLACE.transfer;
assert.ok(oneWay > 0 && roundTrip === oneWay * 2, "fixture rate looks wrong");

describe("priceTransfer — 08_IMPLEMENTATION_PLAN.md Phase 3 verify: all three directions × 1/4/5 people", () => {
  for (const pax of [1, 4, 5]) {
    const billed = billedPax(pax);

    test(`to-hotel at ${pax} pax bills the one-way rate × ${billed}`, () => {
      const p = priceTransfer(PLACE.key, "to-hotel", pax);
      assert.equal(p.rate, oneWay);
      assert.equal(p.billed, billed);
      assert.equal(p.total, oneWay * billed);
      assert.equal(p.round, false);
    });

    test(`to-airport at ${pax} pax bills the SAME one-way rate × ${billed} — never the round-trip rate`, () => {
      const p = priceTransfer(PLACE.key, "to-airport", pax);
      assert.equal(p.rate, oneWay);
      assert.equal(p.total, oneWay * billed);
      assert.equal(p.round, false);
    });

    test(`both (round trip) at ${pax} pax bills the round-trip rate × ${billed}`, () => {
      const p = priceTransfer(PLACE.key, "both", pax);
      assert.equal(p.rate, roundTrip);
      assert.equal(p.total, roundTrip * billed);
      assert.equal(p.round, true);
    });

    test(`to-airport is never priced as "both" — the exact regression Q-01 warns about`, () => {
      const departure = priceTransfer(PLACE.key, "to-airport", pax);
      const roundTripQuote = priceTransfer(PLACE.key, "both", pax);
      assert.notEqual(departure.total, roundTripQuote.total);
      assert.equal(departure.total, oneWay * billed);
    });
  }

  test("an unrecognised direction string is treated as one-way, not silently as a round trip", () => {
    // Guards the exact bug the old `tripType === "one-way" ? oneWay : roundTrip`
    // check had: anything that wasn't the literal string "one-way" fell through
    // to the round-trip branch. A stray/garbled direction must not do that.
    const p = priceTransfer(PLACE.key, "garbled", 2);
    assert.equal(p.rate, oneWay);
  });
});

describe("priceTransfer — no published rate", () => {
  test("a place with no transfer rate returns null", () => {
    // The cruise piers carry transfer: null.
    const pier = getPlace("mobay-cruise-pier");
    assert.equal(priceTransfer(pier.key, "both", 2), null);
  });

  test("an unknown place key returns null", () => {
    assert.equal(priceTransfer("not-a-real-place", "to-hotel", 2), null);
  });
});

describe("quoteTransfer", () => {
  test("wraps priceTransfer and sums adults + children into pax", () => {
    const q = quoteTransfer(PLACE.key, { direction: "to-hotel", adults: 2, children: 2 });
    assert.equal(q.pax, 4);
    assert.equal(q.transport.total, oneWay * MIN_BILLED_PAX);
    assert.equal(q.total, q.transport.total);
  });

  test("an unpriced place quotes null, not zero", () => {
    const q = quoteTransfer("not-a-real-place", { direction: "both", adults: 1, children: 0 });
    assert.equal(q.transport, null);
    assert.equal(q.total, null);
  });
});

describe("describeDirection", () => {
  test("maps every direction to a distinct, human label", () => {
    assert.equal(describeDirection("to-hotel"), "Airport → hotel");
    assert.equal(describeDirection("to-airport"), "Hotel → airport");
    assert.equal(describeDirection("both"), "Round trip");
  });

  test("an unrecognised direction falls back to Round trip, never a blank label", () => {
    assert.equal(describeDirection(undefined), "Round trip");
  });
});

describe("DIRECTIONS", () => {
  test("is exactly the three valid values, for server-side allow-listing", () => {
    assert.deepEqual([...DIRECTIONS].sort(), ["both", "to-airport", "to-hotel"]);
  });
});

describe("money", () => {
  test("drops the decimal for a whole number", () => {
    assert.equal(money(20), "$20");
  });

  test("keeps two decimals for a fraction", () => {
    assert.equal(money(17.5), "$17.50");
  });
});
