/**
 * New-booking email alert, sent server-side through EmailJS.
 *
 * EmailJS is normally a browser library, which would mean shipping the public
 * key in the bundle and allowlisting the domain in their dashboard. Calling the
 * REST API from the server instead lets us authenticate with the private key as
 * `accessToken` — no allowlist, and nothing about the mail path is public.
 *
 * Every failure here is swallowed. A booking that saved but did not email is a
 * missed notification; a booking rejected because the mail server hiccuped is a
 * lost customer. The caller logs and moves on.
 */
const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

export function isNotifyConfigured() {
  return Boolean(
    process.env.EMAILJS_SERVICE_ID &&
      process.env.EMAILJS_TEMPLATE_ID &&
      process.env.EMAILJS_PUBLIC_KEY &&
      process.env.EMAILJS_PRIVATE_KEY
  );
}

/**
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
export async function sendBookingAlert(booking) {
  if (!isNotifyConfigured()) {
    return { sent: false, reason: "not-configured" };
  }

  const travellers =
    `${booking.adults} adult${booking.adults === 1 ? "" : "s"}` +
    (booking.children
      ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
      : "");

  // Flat strings only: EmailJS templates cannot walk nested objects.
  const template_params = {
    reference: booking.reference,
    kind: booking.type === "enquiry" ? "Enquiry" : "Booking",
    tour_title: booking.tourTitle ?? "",
    pickup: booking.pickupLabel ?? "",
    date: booking.date ?? "",
    time: booking.time ?? "",
    travellers,
    total: booking.total ? `US$${booking.total.toFixed(2)}` : "—",
    name: booking.name ?? "",
    email: booking.email ?? "",
    phone: booking.phone ?? "",
    flight: booking.flightNumber ?? "",
    hotel: booking.hotel ?? "",
    notes: booking.notes ?? "",
    // Templates usually put this in "Reply To" so hitting reply answers the guest.
    reply_to: booking.email ?? "",
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params,
      }),
    });

    if (!res.ok) {
      // EmailJS returns plain text on error, not JSON.
      const detail = await res.text().catch(() => "");
      return { sent: false, reason: `${res.status} ${detail}`.trim() };
    }

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err?.message ?? "fetch-failed" };
  }
}
