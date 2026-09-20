/**
 * Booking and payment alerts.
 *
 * This file used to hold the EmailJS request, the template variables and the
 * flattening rules all at once, and the matching HTML lived in a dashboard
 * where a human had to keep it in sync. That sync step got skipped, and every
 * booking alert for the life of the site went out as EmailJS's stock "Rate your
 * experience!" sample.
 *
 * Now the layers are separate: `lib/email/templates/*` render the mail,
 * `lib/email/transport.js` sends it, and this file just joins the two. Nothing
 * about the copy or layout lives outside the repo, so the class of bug is gone
 * rather than the instance.
 *
 * The exported shape is unchanged, so the routes did not have to move.
 */
import { sendEmail, isTransportConfigured, notifyRecipient } from "@/lib/email/transport";
import { bookingAlert } from "@/lib/email/templates/booking-alert";
import { paymentAlert } from "@/lib/email/templates/payment-alert";

export function isNotifyConfigured() {
  return isTransportConfigured();
}

/**
 * There is one template now, so there is nothing extra for payments to
 * configure. The old `EMAILJS_TEMPLATE_ID_PAYMENT` — and the caveat about it
 * being kept out of `isNotifyConfigured()` so payments could not silently
 * disable booking alerts — is gone with the second template it referred to.
 */
export function isPaymentNotifyConfigured() {
  return isTransportConfigured();
}

/**
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
export async function sendBookingAlert(booking) {
  const { subject, html, replyTo } = bookingAlert(booking);
  return sendEmail({
    to: notifyRecipient(),
    subject,
    html,
    replyTo,
  });
}

/**
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
export async function sendPaymentAlert(details) {
  const { subject, html } = paymentAlert(details);
  return sendEmail({
    to: notifyRecipient(),
    subject,
    html,
    // No reply-to: nobody replies to a diagnostic, and the guest did not send it.
  });
}
