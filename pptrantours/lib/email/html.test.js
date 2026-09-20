/**
 * Tests for the escaping rule the email templates rest on.
 *
 * The EmailJS template's body is `{{{content}}}` — triple braces, which inject
 * raw markup on purpose, because the whole body is markup we generated. That is
 * safe only while every guest-supplied value inside it has already been
 * escaped, and this file is what says so.
 *
 * The previous arrangement made that a human's job: the README asked whoever
 * edited the dashboard to keep `{{notes}}` in double braces. This replaces the
 * instruction with a default, and these tests are what stop the default being
 * quietly undone.
 *
 * Run: npm test
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { html, raw, escapeHtml, dash } from "./html.js";

describe("escapeHtml", () => {
  test("escapes the ampersand first, so nothing double-escapes", () => {
    assert.equal(escapeHtml("&<>"), "&amp;&lt;&gt;");
    assert.equal(escapeHtml("&amp;"), "&amp;amp;");
  });

  test("escapes both quote styles, for attribute contexts", () => {
    // href="mailto:..." — breaking out of the attribute is as good as
    // breaking out of the tag, so neither quote may survive.
    assert.equal(escapeHtml(`"'`), "&quot;&#39;");
  });

  test("renders null and undefined as empty, not as the word", () => {
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
  });
});

describe("html", () => {
  test("escapes interpolated values", () => {
    assert.equal(String(html`<p>${"<b>x</b>"}</p>`), "<p>&lt;b&gt;x&lt;/b&gt;</p>");
  });

  test("leaves static markup alone", () => {
    // The literal parts of the template ARE the markup. Escaping them would
    // turn the layout into visible tags.
    assert.equal(String(html`<b>&nbsp;</b>`), "<b>&nbsp;</b>");
  });

  test("nests without double-escaping", () => {
    assert.equal(String(html`${html`<b>${"&"}</b>`}`), "<b>&amp;</b>");
  });

  test("raw() passes markup through untouched", () => {
    assert.equal(String(html`${raw("<b>x</b>")}`), "<b>x</b>");
  });

  test("renders absent values as nothing, so `cond && html` works inline", () => {
    assert.equal(String(html`a${null}b${undefined}c${false}d`), "abcd");
  });

  test("joins arrays, so row lists interpolate", () => {
    assert.equal(String(html`${["a", "b", "c"]}`), "abc");
  });

  test("renders zero rather than swallowing it", () => {
    assert.equal(String(html`${0}`), "0");
  });
});

describe("dash", () => {
  test("blank optionals become an em dash", () => {
    // A blank cell reads as a broken email; "—" reads as "not supplied",
    // which is the actual fact.
    assert.equal(dash(""), "—");
    assert.equal(dash("   "), "—");
    assert.equal(dash(null), "—");
  });

  test("keeps real values, including zero", () => {
    assert.equal(dash("AA1653"), "AA1653");
    assert.equal(dash(0), "0");
  });
});
