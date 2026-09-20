/**
 * Who actually puts the mail on the wire.
 *
 * Both transports take the same thing — a rendered subject and HTML body — so
 * swapping them is an environment change, not a code change. That matters
 * because EmailJS is a stopgap: it is here only because it relays through the
 * connected Gmail and therefore needs no DNS, and we do not control DNS for
 * ppptrantoursjamaica.com yet (it still resolves to the old host).
 *
 * Its limits are the free plan's: 200 emails a month, and requests capped at
 * 50Kb. The booking alert renders to roughly 8Kb, so size is not close — but
 * 200/month is a real ceiling at around 80-100 bookings.
 *
 * Resend lifts that to 3,000/month and signs with our own DKIM instead of
 * sending guest-facing mail through a personal Gmail, which is the part that
 * decides whether a confirmation lands in the inbox or in spam. It needs a
 * verified domain, so it switches on the day DNS is recovered: set
 * RESEND_API_KEY and RESEND_FROM and this module picks it automatically. It is
 * plain REST, so there is no package to install first.
 */
import { site } from "@/app/data/site";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Where internal alerts land. Env override so staging can divert them. */
export function notifyRecipient() {
  return process.env.NOTIFY_EMAIL || site.contact.email;
}

/**
 * EmailJS, via a single dashboard template whose entire body is `{{{content}}}`.
 *
 * One template for every email we send, which is the point: the free plan
 * allows two, and the site needs at least three kinds of mail. It also means
 * the dashboard holds no copy, no layout and no logic that could drift from
 * this repo — it is a dumb pipe with four variables.
 *
 * Called server-side with the private key as `accessToken`, so no domain
 * allowlisting is needed and nothing about the mail path is public.
 */
const emailjs = {
  name: "emailjs",
  isConfigured() {
    return Boolean(
      process.env.EMAILJS_SERVICE_ID &&
        process.env.EMAILJS_TEMPLATE_ID &&
        process.env.EMAILJS_PUBLIC_KEY &&
        process.env.EMAILJS_PRIVATE_KEY
    );
  },
  async send({ to, subject, html, replyTo }) {
    const res = await fetch(EMAILJS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: to,
          subject,
          content: html,
          reply_to: replyTo ?? "",
          from_name: site.name,
        },
      }),
    });

    if (!res.ok) {
      // EmailJS returns plain text on error, not JSON.
      const detail = await res.text().catch(() => "");
      return { sent: false, reason: `${res.status} ${detail}`.trim() };
    }
    return { sent: true };
  },
};

/**
 * Resend. Needs a verified sending domain — a subdomain such as
 * send.ppptrantoursjamaica.com is their recommendation, and it leaves the root
 * domain's existing MX alone.
 *
 * RESEND_FROM is the full header, e.g. `PPP Tran Tours <bookings@send.ppptrantoursjamaica.com>`.
 */
const resend = {
  name: "resend",
  isConfigured() {
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  },
  async send({ to, subject, html, replyTo }) {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent: false, reason: `${res.status} ${detail}`.trim() };
    }
    return { sent: true };
  },
};

/**
 * Resend wins when it is configured, so the migration is: set two variables,
 * confirm mail is arriving, then remove the EmailJS ones. No deploy in between
 * where nothing sends.
 */
export function getTransport() {
  if (resend.isConfigured()) return resend;
  return emailjs;
}

export function isTransportConfigured() {
  return getTransport().isConfigured();
}

/**
 * Every failure is returned, never thrown.
 *
 * A booking that saved but did not email is a missed notification; a booking
 * rejected because the mail provider hiccuped is a lost customer. Callers log
 * and move on.
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  const transport = getTransport();
  if (!transport.isConfigured()) {
    return { sent: false, reason: "not-configured" };
  }
  if (!to) {
    return { sent: false, reason: "no-recipient" };
  }

  try {
    return await transport.send({ to, subject, html, replyTo });
  } catch (err) {
    return { sent: false, reason: err?.message ?? "fetch-failed" };
  }
}
