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

  /*
   * Flat strings only: EmailJS templates cannot walk nested objects.
   *
   * Empty optionals become an em dash rather than "". The template renders a
   * fixed set of rows, and a blank cell reads as a broken email while "—"
   * reads as "not supplied" — which is the actual fact. It also spares the
   * template needing conditionals.
   */
  const dash = (v) => {
    const s = typeof v === "string" ? v.trim() : v;
    return s ? String(s) : "—";
  };

  const template_params = {
    reference: booking.reference,
    kind: booking.type === "enquiry" ? "Enquiry" : "Booking",
    tour_title: dash(booking.tourTitle),
    pickup: dash(booking.pickupLabel),
    date: dash(booking.date),
    time: dash(booking.time),
    travellers,
    total: booking.total ? `US$${booking.total.toFixed(2)}` : "—",
    name: dash(booking.name),
    email: dash(booking.email),
    phone: dash(booking.phone),
    flight: dash(booking.flightNumber),
    hotel: dash(booking.hotel),
    notes: dash(booking.notes),
    // Templates put this in the "Reply To" field so hitting reply answers the guest.
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
