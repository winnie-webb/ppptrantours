/**
 * The after-the-trip thank-you, sent from /admin once a booking is completed.
 * Its one job is the Google review link; Tripadvisor sits underneath as the
 * second choice, because that is where PPP's existing 680 reviews live.
 *
 * Never sent before the trip, and it offers nothing in return for a review —
 * Google removes reviews that were asked for either way.
 *
 * Same brand and table-based layout as booking-confirmation.js. Links are
 * passed in rather than imported from site.js: this module is loaded directly
 * by `node --test`, which cannot resolve the `@/` alias.
 */
import { html, raw, dash } from "../html.js";

const TEXT = "#3a2e31";
const MUTED = "#8a7d80";
const CRIMSON = "#a80424";
const GOLD = "#f1d72d";
const SAND = "#fbf7f4";

/**
 * @param {object} booking  the same shape the bookings route persists
 * @param {string} googleReviewUrl
 * @param {string} tripadvisorUrl
 * @returns {{subject: string, html: string, preheader: string}}
 */
export function reviewRequest(booking, { googleReviewUrl, tripadvisorUrl }) {
  const firstName = (booking.name ?? "").trim().split(/\s+/)[0];
  const what = booking.kind === "transfer" ? "your transfer" : dash(booking.tourTitle);

  const body = html`
<div style="margin:0;padding:0;background-color:${SAND};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Thank you for travelling with us — could you spare a minute for a review?
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${SAND};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Masthead -->
          <tr>
            <td align="center" style="background-color:#ffffff;padding:28px 24px 24px 24px;border-bottom:4px solid ${GOLD};">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;letter-spacing:2px;color:${CRIMSON};">
                PPP <span style="color:${TEXT};">TRAN TOURS</span>
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};padding-top:8px;">
                Private &middot; Personalized &middot; Professional
              </div>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="background-color:${CRIMSON};padding:24px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#ffffff;">
                ${firstName ? html`Thank you, ${firstName}.` : "Thank you."}
              </div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:24px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT};">
              <p style="margin:0 0 14px 0;">
                Thank you for choosing PPP Tran Tours for ${what}. We hope you had a wonderful time in Jamaica.
              </p>
              <p style="margin:0;">
                Most of our guests find us through reviews from people like you.
                If you have a minute, a few words about your day would mean a lot to us.
              </p>
            </td>
          </tr>

          <!-- Actions -->
          <tr>
            <td style="padding:20px 24px 8px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="border-radius:999px;background-color:${CRIMSON};">
                    <a href="${raw(googleReviewUrl)}" style="display:block;padding:14px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">
                      &#9733; Leave a Google review
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 24px 28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};">
              Prefer Tripadvisor?
              <a href="${raw(tripadvisorUrl)}" style="color:${CRIMSON};font-weight:bold;text-decoration:none;">Review us there</a>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:0 24px 28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT};">
              Safe travels, and we hope to welcome you back.<br>
              <strong>Donovan Pugh</strong><br>
              <span style="color:${MUTED};font-size:13px;">Owner, PPP Tran Tours</span>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:${SAND};border-top:1px solid #f0e8e2;padding:22px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;color:${MUTED};">
              Booking reference ${dash(booking.reference)}
              <br>PPP Tran Tours &middot; Montego Bay, Jamaica &middot; ppptrantoursjamaica.com
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>`;

  return {
    subject: "Thank you for travelling with PPP Tran Tours",
    html: String(body),
    preheader: "Thank you for travelling with us — could you spare a minute for a review?",
  };
}
