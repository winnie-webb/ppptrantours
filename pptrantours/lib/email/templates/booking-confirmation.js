/**
 * The guest-facing confirmation email — the second email a booking sends,
 * after the internal alert in booking-alert.js. That one tells Mr. Pugh a
 * booking came in; this one tells the guest it did, with the one link that
 * matters: back to their own booking page, where the real-time payment state
 * lives. Nothing here is ever the guest's only record of their booking — the
 * page at that link is — this is a pointer to it that survives losing the
 * reference number.
 *
 * Same brand and table-based layout as booking-alert.js, for the same
 * reasons: Outlook, image-blocking, no external fonts.
 */
import { html, raw, dash } from "../html.js";

const INK = "#150a0d";
const CRIMSON = "#a80424";
const GOLD = "#f1d72d";
const SAND = "#fbf7f4";

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

function directionLabel(direction) {
  if (direction === "to-airport") return "Departure";
  if (direction === "to-hotel") return "Arrival";
  return "Round trip";
}

/**
 * @param {object} booking  the same shape the bookings route persists
 * @param {string} bookingUrl  the guest's own booking page, token included
 * @param {string} whatsappUrl  pre-filled WhatsApp message for this booking
 * @returns {{subject: string, html: string, preheader: string}}
 */
export function bookingConfirmation(booking, { bookingUrl, whatsappUrl }) {
  const isTransfer = booking.kind === "transfer";
  const isEnquiry = booking.type === "enquiry";
  const quoted = booking.transportTotal != null;

  const direction =
    booking.direction || (booking.tripType === "one-way" ? "to-hotel" : booking.tripType ? "both" : "");

  const name = dash(booking.name);
  const firstName = (booking.name ?? "").trim().split(/\s+/)[0] || "there";
  const date = dash(booking.date);
  const tourTitle = dash(booking.tourTitle);

  const total =
    booking.transportTotal != null ? money(booking.transportTotal) : "to be confirmed";

  const headline = isEnquiry
    ? "We've got your message"
    : quoted
      ? "You're booked"
      : "Request received";

  const nextSteps = isEnquiry
    ? "We'll reply by email or WhatsApp, usually within the hour during dispatch hours."
    : quoted
      ? "Your driver and exact pickup time follow separately, usually within the hour during dispatch hours. Nothing else for you to do."
      : "We haven't published a rate for this route yet — we'll come back with a firm price, same day, and you can confirm from there.";

  const body = html`
<div style="margin:0;padding:0;background-color:${SAND};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${dash(booking.reference)} &middot; ${tourTitle} &middot; ${date} &middot; ${total}
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

          <!-- Headline -->
          <tr>
            <td style="background-color:${CRIMSON};padding:24px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#ffffff;">
                ${headline}, ${dash(firstName)}.
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;opacity:0.8;padding-top:4px;">
                Reference ${dash(booking.reference)}
              </div>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:24px 24px 8px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="font-family:Arial,Helvetica,sans-serif;font-size:14px;">
                ${row(html`${isTransfer ? "Transfer" : "Tour"}`, html`<strong>${tourTitle}</strong>`, { first: true })}
                ${isTransfer && direction ? row("Direction", directionLabel(direction)) : ""}
                ${row("Hotel / villa / pier", dash(booking.placeLabel))}
                ${row("Date", date)}
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
                    Total &mdash; transport only
                  </td>
                  <td align="right" style="padding:16px 20px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;color:${GOLD};">
                    ${total}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next steps -->
          <tr>
            <td style="padding:8px 24px 8px 24px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${INK};">
                ${nextSteps}
              </p>
            </td>
          </tr>

          <!-- Actions -->
          <tr>
            <td style="padding:16px 24px 28px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="border-radius:999px;background-color:${CRIMSON};">
                    <a href="${raw(bookingUrl)}" style="display:block;padding:14px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">
                      View your booking
                    </a>
                  </td>
                </tr>
                <tr><td style="height:10px;line-height:10px;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="border-radius:999px;border:1px solid #e2dcd6;">
                    <a href="${raw(whatsappUrl)}" style="display:block;padding:13px 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:${INK};text-decoration:none;">
                      Message us on WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:${INK};padding:22px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:#ffffff;">
              <div style="opacity:0.6;">
                Reply to this email and it reaches us directly.
              </div>
              <div style="opacity:0.35;padding-top:8px;">
                Sent automatically by ppptrantoursjamaica.com. Keep this for your records — quoting your reference gets you the fastest answer.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>`;

  return {
    subject: isEnquiry
      ? `We've got your message — ${booking.reference}`
      : `${headline} — ${booking.reference}`,
    html: String(body),
    preheader: `${dash(booking.reference)} · ${tourTitle} · ${date} · ${total}`,
  };
}
