/**
 * A tagged template literal that escapes every interpolated value by default.
 *
 * This exists because of how the email templates used to work. They lived in
 * the EmailJS dashboard, where `{{notes}}` escaped its value and `{{{notes}}}`
 * did not, and the rule "keep the guest's fields in double braces" survived
 * only as a warning in a README. A rule a human has to remember is a rule that
 * eventually gets forgotten — and the field it protects, `notes`, is free text
 * typed by a stranger.
 *
 * So escaping here is opt-OUT, not opt-in:
 *
 *   html`<div>${booking.notes}</div>`        // escaped, always
 *   html`<div>${raw(renderedFragment)}</div>` // explicit, and greppable
 *
 * Reviewing this is one search for `raw(`. Every other interpolation in every
 * template is safe without anyone having thought about it.
 */

/**
 * Markup that is already safe, so it survives interpolation untouched.
 * Nesting composes: `html` returns one of these, so a fragment built by one
 * template can be dropped into another without being escaped twice.
 */
class Safe {
  constructor(value) {
    this.value = String(value);
  }
  toString() {
    return this.value;
  }
}

/**
 * Escape hatch. Wrap anything you have already made safe yourself.
 *
 * Never call this on a value that came from a form. The only legitimate
 * arguments are markup this codebase generated.
 */
export function raw(value) {
  return new Safe(value ?? "");
}

/** `&` first, or the other replacements get double-escaped. */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/*
 * Quotes are escaped along with the angle brackets on purpose: several values
 * land inside attributes (`href="mailto:..."`), where breaking out of the
 * attribute is as good as breaking out of the tag.
 *
 * Note what this does NOT do: it does not make a URL safe to put in `href`. It
 * stops the attribute being escaped out of, not `javascript:` being navigated
 * to. Every href in these templates has a literal `mailto:` or `tel:` prefix
 * ahead of the interpolation, which is what keeps that shut.
 */
function interpolate(value) {
  if (value instanceof Safe) return value.value;
  if (Array.isArray(value)) return value.map(interpolate).join("");
  // Render nothing for absent values, so `cond && html`...`` works inline.
  if (value == null || value === false) return "";
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    out += interpolate(values[i]) + strings[i + 1];
  }
  return new Safe(out);
}

/** Final step: a `Safe` becomes the plain string a transport can send. */
export function render(node) {
  return String(node);
}

/**
 * Blank optionals become an em dash rather than "".
 *
 * The templates render a fixed set of rows. An empty cell reads as a broken
 * email; "—" reads as "the guest did not supply this", which is the actual
 * fact. It also spares every template a conditional.
 */
export function dash(value) {
  const s = typeof value === "string" ? value.trim() : value;
  return s || s === 0 ? String(s) : "—";
}
