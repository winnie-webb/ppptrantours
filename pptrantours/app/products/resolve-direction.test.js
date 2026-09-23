import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveDirection } from "./resolve-direction.js";

describe("resolveDirection — 08_IMPLEMENTATION_PLAN.md Phase 3 verify: an API test that to-airport is never priced as both", () => {
  test("a valid direction is passed through unchanged", () => {
    assert.equal(resolveDirection({ direction: "to-hotel" }), "to-hotel");
    assert.equal(resolveDirection({ direction: "to-airport" }), "to-airport");
    assert.equal(resolveDirection({ direction: "both" }), "both");
  });

  test("to-airport never resolves to both, however it arrives", () => {
    assert.notEqual(resolveDirection({ direction: "to-airport" }), "both");
  });

  test("legacy tripType: one-way becomes to-hotel, not something ambiguous", () => {
    assert.equal(resolveDirection({ tripType: "one-way" }), "to-hotel");
  });

  test("legacy tripType: round-trip becomes both", () => {
    assert.equal(resolveDirection({ tripType: "round-trip" }), "both");
  });

  test("an unrecognised direction string with no legacy fallback defaults to both, the same as an empty body — it never silently becomes to-hotel", () => {
    assert.equal(resolveDirection({ direction: "sometime-next-week" }), "both");
  });

  test("an empty body defaults to both, matching the old default", () => {
    assert.equal(resolveDirection({}), "both");
  });

  test("direction takes precedence over a conflicting legacy tripType", () => {
    assert.equal(
      resolveDirection({ direction: "to-airport", tripType: "round-trip" }),
      "to-airport"
    );
  });
});
