# EmailJS templates

Source of truth for the EmailJS templates. EmailJS stores them in its own
dashboard, so these files are the version-controlled copy — edit here, then
paste into the dashboard, so the two do not silently drift.

## `booking-alert.html` — new booking / enquiry

Internal notification to PPP, sent by `lib/notify.js` from
`app/api/bookings/route.js`. Not guest-facing.

### Dashboard settings

| Field | Value |
| --- | --- |
| To | `ppptrantours@gmail.com` |
| From name | `PPP Tran Tours website` |
| Reply To | `{{reply_to}}` |
| Subject | `New {{kind}} — {{reference}} — {{name}}` |
| Content | paste `booking-alert.html` in **Code** view, not the visual editor |

`Reply To` is the point of the whole thing: hitting reply answers the guest
rather than the website.

Put the template's ID in `EMAILJS_TEMPLATE_ID` (`.env.local`, and Vercel's
environment variables for production). Until it is set, `isNotifyConfigured()`
returns false, the route returns `emailed: false`, and bookings still save.

### Variables

Every one is supplied by `sendBookingAlert()` in `lib/notify.js`. Optional
fields that the guest left blank arrive as an em dash, never as an empty
string, so no row ever renders blank and the template needs no conditionals.

| Variable | Notes |
| --- | --- |
| `{{reference}}` | e.g. `PPP-K3F9QX` |
| `{{kind}}` | `Booking` or `Enquiry` |
| `{{name}}` `{{email}}` `{{phone}}` | guest contact |
| `{{tour_title}}` `{{pickup}}` | what they booked |
| `{{date}}` `{{time}}` `{{flight}}` `{{hotel}}` | when and where |
| `{{travellers}}` | pre-formatted, e.g. `2 adults, 1 child` |
| `{{total}}` | pre-formatted, e.g. `US$187.50` — the **server's** figure |
| `{{notes}}` | free text from the guest |
| `{{reply_to}}` | the guest's email, for the Reply To field |

### Two things not to change

**Keep `{{notes}}` in double braces.** Notes are free text typed by a stranger.
Double braces escape HTML; EmailJS's triple-brace form (`{{{notes}}}`) injects
raw markup, which would let anyone submitting the form write HTML into an inbox.

**`{{total}}` is authoritative.** The route recomputes it from `products.json`
and discards whatever the browser posted, so this figure is what is stored in
Firestore — not what the guest's screen happened to show.

### Editing

Table-based layout with inline styles on purpose: Outlook has no flexbox or
grid, and `<style>` blocks get stripped by several clients. Fraunces and Plus
Jakarta Sans cannot load in email, so Georgia and Arial stand in for the
display and body faces. Brand colours are `#150a0d` ink, `#a80424` crimson,
`#f1d72d` gold, `#fbf7f4` sand.

The masthead is HTML text rather than an image, so it needs no hosted asset and
survives image-blocking. To use the real logo once the domain points at Vercel,
swap the wordmark for
`<img src="https://ppptrantoursjamaica.com/logo.png" width="140" alt="PPP Tran Tours">`
and keep a text fallback in the `alt`.

## Not built yet

A guest-facing acknowledgement. `app/data/site.js` promises one in the FAQ
("you'll get an automatic acknowledgement email"), and that promise is
currently untrue — only this internal alert exists.
