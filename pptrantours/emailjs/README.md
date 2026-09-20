# Transactional email

The templates are **code**, in `lib/email/templates/`. Nothing about the copy or
the layout lives in a provider's dashboard any more.

That is a deliberate reversal. This folder used to hold `booking-alert.html`
with instructions to paste it into the EmailJS dashboard by hand. Nobody ever
did, so from launch until 2026-09-20 every booking alert went out as EmailJS's
stock "Rate your experience! — [Company Name]" sample, with all of our variables
sent and silently discarded. A sync step a human has to remember is a step that
eventually gets skipped.

## Layout

| File | What it is |
| --- | --- |
| `lib/email/html.js` | the `html` tagged template — escapes every `${}` by default |
| `lib/email/templates/booking-alert.js` | internal new-booking / enquiry alert |
| `lib/email/templates/payment-alert.js` | internal "card checkout opened" diagnostic |
| `lib/email/transport.js` | who sends it — EmailJS now, Resend when DNS allows |
| `lib/notify.js` | joins the two; the API the routes call |

## The dashboard now holds one dumb template

EmailJS still delivers the mail, but it knows nothing about it. Create **one**
template and never touch it again:

| Field | Value |
| --- | --- |
| To | `{{to_email}}` |
| From name | `{{from_name}}` |
| Reply To | `{{reply_to}}` |
| Subject | `{{subject}}` |
| Content | `{{{content}}}` — in **Code** view, nothing else in the body |

Put its ID in `EMAILJS_TEMPLATE_ID`. `EMAILJS_TEMPLATE_ID_PAYMENT` is gone;
delete it from Vercel.

Three braces on `content` is what lets the body be HTML at all — double braces
would escape our own markup into visible tags. That is safe **only** because of
the rule below.

### The one rule

Guest-supplied values are escaped by `html.js`, automatically, because every
`${}` goes through `escapeHtml` unless it is wrapped in `raw()`.

```js
html`<div>${booking.notes}</div>`         // escaped — the default
html`<div>${raw(fragment)}</div>`         // raw — explicit and greppable
```

**Never call `raw()` on anything that came from a form.** Reviewing this is one
search for `raw(`; today every use of it is a style string or a nested `html`
fragment. This is the same protection the old `{{notes}}` double-brace rule
gave, except it is now the default rather than something to remember.

## Limits worth knowing

EmailJS free: **200 emails/month**, **2 templates**, requests capped at
**50Kb**. The booking alert renders to about 8Kb, so size is not close. The
2-template cap is why everything shares one `{{{content}}}` template — the site
needs at least three kinds of mail. 200/month is a real ceiling at roughly
80–100 bookings.

## Moving to Resend

EmailJS is a stopgap. It is here only because it relays through the connected
Gmail and so needs **no DNS**, and `ppptrantoursjamaica.com` still resolves to
the old host (`70.32.23.13`, `ns1–4.supercp.com`) — the domain is locked at
Instra until it expires 2026-12-08.

Resend gives 3,000/month and signs with our own DKIM instead of sending
guest-facing mail through a personal Gmail, which is what decides whether a
confirmation lands in the inbox or in spam. It needs a verified sending domain.

Once DNS is recovered:

1. Add `send.ppptrantoursjamaica.com` in Resend — a subdomain, so the root
   domain's existing MX is left alone.
2. Publish the DKIM, SPF and return-path MX records it gives you. Verification
   can take up to 24 hours.
3. Set `RESEND_API_KEY` and `RESEND_FROM`
   (`PPP Tran Tours <bookings@send.ppptrantoursjamaica.com>`).
4. `getTransport()` prefers Resend the moment both are set — no code change and
   no deploy where nothing sends. Confirm mail is arriving, then remove the four
   `EMAILJS_*` variables.

Resend is plain REST here, so there is no package to install.

## Not built yet

A guest-facing acknowledgement. It drops in as one more file in
`lib/email/templates/` plus a call in the bookings route — the 2-template cap
that used to block it no longer applies.

(The previous version of this file claimed `app/data/site.js` promises one in
the FAQ. That overclaim was removed in `af2cedf`; the promise is not currently
made anywhere, so this is a feature, not a broken promise.)
