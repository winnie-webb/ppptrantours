/**
 * Tests for the after-the-trip review request. Same concerns as the other
 * templates: a guest's own name cannot put a tag in their inbox, and the
 * links in it are the real ones.
 *
 * Run: npm test
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { reviewRequest } from "./review-request.js";

const HOSTILE = `<script>alert(1)</script><img src=x onerror=alert(2)>"'&`;

const LINKS = {
  googleReviewUrl: "https://g.page/r/Cez1mmUHMeeyEBM/review",
  tripadvisorUrl: "https://www.tripadvisor.com/Attraction_Review-g147311-d2343969",
};

const BOOKING = {
  reference: "PPP-K3F9QX",
  kind: "tour",
  name: "Alicia Brown",
  tourTitle: "Dunn's River Falls",
};

describe("reviewRequest — injection", () => {
  const out = reviewRequest({ ...BOOKING, name: HOSTILE, tourTitle: HOSTILE }, LINKS);

  test("hostile input opens no script tag", () => {
    assert.ok(!/<script/i.test(out.html));
  });

  test("it is escaped rather than stripped", () => {
    assert.ok(out.html.includes("&lt;script&gt;"));
  });
});

describe("reviewRequest — content", () => {
  const out = reviewRequest(BOOKING, LINKS);

  test("greets the guest by first name", () => {
    assert.ok(out.html.includes("Thank you, Alicia."));
  });

  test("links to the Google review form", () => {
    assert.ok(out.html.includes(LINKS.googleReviewUrl));
  });

  test("offers Tripadvisor as the second choice", () => {
    assert.ok(out.html.includes(LINKS.tripadvisorUrl));
  });

  test("names the tour for a tour, and says transfer for a transfer", () => {
    assert.ok(out.html.includes("Dunn&#39;s River Falls") || out.html.includes("Dunn's River Falls"));
    const transfer = reviewRequest({ ...BOOKING, kind: "transfer" }, LINKS);
    assert.ok(transfer.html.includes("your transfer"));
  });

  test("falls back to a generic greeting without a name", () => {
    const anon = reviewRequest({ reference: "PPP-CCC333" }, LINKS);
    assert.ok(anon.html.includes("Thank you."));
    assert.ok(!anon.html.includes("Thank you, ."));
  });
});
