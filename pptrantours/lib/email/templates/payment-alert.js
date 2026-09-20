/**
 * The owner's alert that a card payment was STARTED. Internal, not guest-facing.
 *
 * This template never existed. `sendPaymentAlert()` has been calling a template
 * ID that was either unset — in which case nothing sent — or pointed at whatever
 * happened to be in the EmailJS dashboard. Either way the alert it was written
 * for has never actually arrived.
 *
 * What it is for, now that PayPal replaced WiPay: `intent: CAPTURE` means no
 * money moves until our return route captures, so an abandoned checkout is no
 * longer a silent charge. The case that survives is a capture that THROWS —
 * genuinely ambiguous, because the charge may have landed and we lost the
 * answer. The return route deliberately writes nothing then, so this email and
 * its order_id are the only trail to the transaction in the PayPal dashboard.
 *
 * Deliberately plainer than the booking alert. This is a diagnostic that gets
 * searched, not an arrival that gets read.
 */
import { html, raw, dash } from "../html.js";

const INK = "#150a0d";
const CRIMSON = "#a80424";
const SAND = "#fbf7f4";

function row(label, value, { mono = false } = {}) {
  const family = mono
    ? "font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;"
    : "font-family:Arial,Helvetica,sans-serif;";
  return html`
    <tr>
      <td width="34%" style="padding:9px 0;border-top:1px solid #f4efeb;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${INK};opacity:0.5;vertical-align:top;">${label}</td>
      <td style="padding:9px 0;border-top:1px solid #f4efeb;${raw(family)}font-size:13px;color:${INK};vertical-align:top;word-break:break-all;">${value}</td>
    </tr>
  `;
}

/**
 * @returns {{subject: string, html: string, preheader: string}}
 */
export function paymentAlert({
  reference,
  orderId,
  amountCents,
  currency,
  provider,
  environment,
  name,
  tourTitle,
  date,
}) {
  const amount = `${currency ?? "USD"} ${(Number(amountCents ?? 0) / 100).toFixed(2)}`;
  const isLive = String(environment ?? "").toLowerCase() === "live";

  const body = html`
<div style="margin:0;padding:0;background-color:${SAND};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${dash(reference)} &middot; ${amount} &middot; ${dash(orderId)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${SAND};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

          <tr>
            <td style="background-color:${INK};padding:22px 24px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;opacity:0.5;">
                PPP Tran Tours &middot; payment started
              </div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#ffffff;padding-top:8px;">
                ${amount}
                ${
                  isLive
                    ? null
                    : html`<span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${CRIMSON};background-color:#ffffff;border-radius:4px;padding:3px 7px;vertical-align:middle;margin-left:8px;">${dash(environment)}</span>`
                }
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 24px 4px 24px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:${INK};opacity:0.75;">
                A guest opened the card checkout. <strong>This is not a confirmed payment.</strong>
                If no booking shows as paid and the guest says they were charged,
                search the order id below in the ${dash(provider)} dashboard.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 24px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${row("Reference", dash(reference))}
                ${row("Order id", dash(orderId), { mono: true })}
                ${row("Amount", amount)}
                ${row("Provider", dash(provider))}
                ${row("Environment", dash(environment))}
                ${row("Guest", dash(name))}
                ${row("Tour", dash(tourTitle))}
                ${row("Travel date", dash(date))}
                ${row("Started at", new Date().toISOString())}
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color:${INK};padding:18px 24px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#ffffff;">
              <div style="opacity:0.35;">
                Sent when card checkout is opened. One of these with no matching
                paid booking is the only sign of a capture that failed mid-flight.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>`;

  return {
    subject: `Payment started — ${dash(reference)} — ${amount}${isLive ? "" : ` [${dash(environment)}]`}`,
    html: String(body),
    preheader: `${dash(reference)} · ${amount} · ${dash(orderId)}`,
  };
}
