/**
 * Internal notification to PPP that a booking or enquiry came in. Not guest-facing.
 *
 * Ported from the HTML that used to be pasted into the EmailJS dashboard by
 * hand. The design is unchanged; what changed is that it now lives here, gets
 * reviewed in diffs, and cannot drift from what the dashboard happens to hold.
 *
 * Table-based layout with inline styles on purpose: Outlook has no flexbox or
 * grid, and several clients strip `<style>` blocks. Fraunces and Plus Jakarta
 * Sans cannot load in email, so Georgia and Arial stand in for the display and
 * body faces. Brand colours are #150a0d ink, #a80424 crimson, #f1d72d gold,
 * #fbf7f4 sand.
 *
 * The masthead is HTML text rather than an image, so it needs no hosted asset
 * and survives image-blocking. Once the domain points at Vercel this can become
 * `<img src="https://ppptrantoursjamaica.com/logo.png" width="140" ...>` with a
 * text fallback in the `alt`.
 */
import { html, raw, dash } from "../html.js";

const INK = "#150a0d";
const CRIMSON = "#a80424";
const GOLD = "#f1d72d";
const SAND = "#fbf7f4";

/** One label/value row in the details table. */
function row(label, value, { first = false } = {}) {
  const border = first ? "" : "border-top:1px solid #f4efeb;";
  return html`
    <tr>
      <td width="38%" style="padding:10px 0;color:${INK};opacity:0.5;${raw(border)}vertical-align:top;">${label}</td>
      <td style="padding:10px 0;color:${INK};${raw(border)}vertical-align:top;">${value}</td>
    </tr>
  `;
}

function money(cents) {
  return `US$${Number(cents).toFixed(2)}`;
}

/**
 * Kept as a small local copy of `describeDirection` in
 * app/products/pricing.js rather than an import: that module reaches into
 * `app/data/*` via the `@/` alias, which only Next's bundler resolves — this
 * template is also loaded directly by `node --test`, which does not.
 */
function directionLabel(direction) {
  if (direction === "to-airport") return "Departure";
  if (direction === "to-hotel") return "Arrival";
  return "Round trip";
}

/**
 * @param {object} booking  the same shape the bookings route persists
 * @returns {{subject: string, html: string, replyTo: string, preheader: string}}
 */
export function bookingAlert(booking) {
  const kind = booking.type === "enquiry" ? "Enquiry" : "Booking";
  const isTransfer = booking.kind === "transfer";

  const direction =
    booking.direction || (booking.tripType === "one-way" ? "to-hotel" : booking.tripType ? "both" : "");

  const travellers =
    `${booking.adults} adult${booking.adults === 1 ? "" : "s"}` +
    (booking.children
      ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
      : "");

  /*
   * The server's figure, not the browser's. The bookings route recomputes this
   * from products.json and discards whatever the client posted, so this is what
   * is stored in Firestore — not what the guest's screen happened to show.
   */
  const total =
    booking.transportTotal != null
      ? money(booking.transportTotal)
      : "quote requested";

  const name = dash(booking.name);
  const date = dash(booking.date);
  const tourTitle = dash(booking.tourTitle);

  const body = html`
<div style="margin:0;padding:0;background-color:${SAND};">
  <!-- Preheader: the grey line shown next to the subject in an inbox list.
       Hidden in the body itself. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${name} &middot; ${tourTitle} &middot; ${date} &middot; ${total}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${SAND};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Masthead -->
          <tr>
            <td align="center" style="background-color:${INK};padding:28px 24px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;letter-spacing:2px;color:${GOLD};">
                PPP <span style="color:#ffffff;">TRAN TOURS</span>
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;opacity:0.55;padding-top:8px;">
                Private &middot; Personalized &middot; Professional
              </div>
            </td>
          </tr>

          <!-- Reference band -->
          <tr>
            <td style="background-color:${CRIMSON};padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ffffff;opacity:0.75;">
                    New ${kind}
                  </td>
                  <td align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:${GOLD};">
                    ${dash(booking.reference)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Guest -->
          <tr>
            <td style="padding:28px 24px 8px 24px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${INK};">
                ${name}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;padding-top:6px;">
                <a href="mailto:${dash(booking.email)}" style="color:${CRIMSON};text-decoration:none;">${dash(booking.email)}</a>
                <span style="color:${INK};opacity:0.3;">&nbsp;&middot;&nbsp;</span>
                <a href="tel:${dash(booking.phone)}" style="color:${CRIMSON};text-decoration:none;">${dash(booking.phone)}</a>
              </div>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:16px 24px 8px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="font-family:Arial,Helvetica,sans-serif;font-size:14px;">
                <tr>
                  <td colspan="2" style="border-top:1px solid #ece5e0;height:1px;line-height:1px;">&nbsp;</td>
                </tr>
                ${row(html`Tour`, html`<strong>${tourTitle}</strong>`, { first: true })}
                ${row("Pickup / drop-off", dash(booking.placeLabel))}
                ${isTransfer && direction ? row("Direction", directionLabel(direction)) : ""}
                ${row(
                  isTransfer && direction === "to-airport" ? "Departure date" : "Date",
                  html`${date} &nbsp;<span style="opacity:0.55;">${dash(booking.time)}</span>`
                )}
                ${row(
                  isTransfer && direction === "to-airport" ? "Departure flight" : "Flight",
                  dash(booking.flightNumber)
                )}
                ${isTransfer && direction === "both" && (booking.returnDate || booking.returnFlight)
                  ? row(
                      "Departure",
                      html`${dash(booking.returnDate)} &nbsp;<span style="opacity:0.55;">${dash(booking.returnFlight)}</span>`
                    )
                  : ""}
                ${row("Hotel / villa / pier", dash(booking.placeLabel))}
                ${row("Travellers", travellers)}
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding:16px 24px 8px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:${INK};border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;opacity:0.6;">
                    Estimated total &mdash; transport only
                  </td>
                  <td align="right" style="padding:16px 20px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;color:${GOLD};">
                    ${total}
                  </td>
                </tr>
                <tr><td colspan="2" style="height:4px;line-height:4px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Notes -->
          <tr>
            <td style="padding:8px 24px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:${SAND};border-left:3px solid ${CRIMSON};border-radius:0 8px 8px 0;">
                <tr>
                  <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${INK};opacity:0.45;padding-bottom:6px;">
                      Guest notes
                    </div>
                    <div style="font-size:14px;line-height:22px;color:${INK};">${dash(booking.notes)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:${INK};padding:22px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#ffffff;">
              <div style="opacity:0.6;">
                Reply to this email to answer ${name} directly.
              </div>
              <div style="opacity:0.35;padding-top:8px;">
                Sent automatically by ppptrantoursjamaica.com when a booking form is submitted.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>`;

  return {
    subject: `New ${kind} — ${booking.reference} — ${name}`,
    html: String(body),
    preheader: `${name} · ${tourTitle} · ${date} · ${total}`,
    // The point of the whole thing: hitting reply answers the guest, not the website.
    replyTo: booking.email ?? "",
  };
}
