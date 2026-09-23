/**
 * The transfer direction, re-derived from a posted body rather than trusted
 * outright — same reasoning as re-pricing everything else in
 * app/api/bookings/route.js. Kept in its own module, separate from that
 * route, purely so it can be imported by `node --test`: the route's other
 * imports (`next/server`, firebase-admin) are Next/Node-runtime-only and
 * cannot load under the plain test runner, but this one function is exactly
 * what 08_IMPLEMENTATION_PLAN.md's Phase 3 verify step asks to be tested —
 * "an API test that to-airport is never priced as both."
 *
 * `direction` is the current three-way field ("to-hotel" | "to-airport" |
 * "both"); `tripType` is the two-way field older/cached clients may still
 * post. The bug this guards against: a naive check of
 * `tripType === "one-way" ? oneWay : roundTrip` treats ANY other string —
 * including a new, valid `direction` value like `"to-airport"` — as a round
 * trip, silently double-charging a departure-only transfer. Every value this
 * function can return is checked against the explicit allow-list in
 * `DIRECTIONS`, so an unrecognised value never falls through to "both".
 */
import { DIRECTIONS } from "./pricing.js";

export function resolveDirection(body) {
  if (DIRECTIONS.includes(body?.direction)) return body.direction;
  // Legacy two-way field: "one-way" meant an arrival, since departure-only
  // transfers did not exist as a distinct option yet.
  return body?.tripType === "one-way" ? "to-hotel" : "both";
}
