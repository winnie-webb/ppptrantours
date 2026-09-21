/**
 * Booking terms and privacy policy.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * READ THIS BEFORE THE SITE TAKES A CARD PAYMENT.
 *
 * Every clause marked `confirm: true` is a DRAFT. It is what is normal for a
 * private-transfer operator in the Caribbean, not something Mr. Pugh has said.
 * The numbers in particular — the 24-hour notice window, the no-show rule, the
 * 48-hour flight-details request — were written to be reasonable, not because
 * anyone quoted them.
 *
 * They render with a visible "to be confirmed" marker for exactly that reason,
 * and the marker should come off clause by clause as he signs each one off. A
 * cancellation policy nobody has agreed to is worse than none at all: it is the
 * document a guest will hold you to in a chargeback.
 *
 * Anything without the flag is a statement of how the site already demonstrably
 * behaves — what the booking form collects, that Firestore rules deny client
 * reads, that gate fees are never collected — and is safe as written.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { site } from "./site";
import { MIN_BILLED_PAX } from "@/app/products/pricing";

/** Booking, payment, cancellation and liability. */
export const bookingTerms = [
  {
    key: "who",
    heading: "Who you are contracting with",
    body: [
      `${site.legalName} ("PPP", "we") is a private transfer and tour operator based at ${site.address.line1}, ${site.address.line2}, ${site.address.city}, ${site.address.parish}, ${site.address.country}, licensed by the Jamaica Tourist Board and the Transport Authority of Jamaica.`,
      `These terms cover any transfer or excursion booked through this website, by telephone on ${site.contact.phone}, or over WhatsApp.`,
    ],
  },
  {
    key: "request",
    heading: "When your booking is confirmed",
    body: [
      "Sending the form on this site makes a booking. Where we publish a set rate for your route, that booking is confirmed straight away and you will get a reference beginning PPP- to quote back to us. You do not need to wait for us to accept it.",
      "Your driver and the exact pickup time follow separately, by WhatsApp or email, usually within the hour during dispatch hours.",
      "Where we do not publish a set rate, the form asks for a price instead of taking a booking, and it says so. Nothing is agreed until we have come back with a firm figure and you have confirmed it.",
    ],
  },
  {
    key: "price",
    heading: "What the price covers",
    body: [
      `Transport is priced per person, and every party is charged for at least ${MIN_BILLED_PAX} people. So one, two, three and four travellers all pay the same, and from the fifth passenger each person simply adds the published rate.`,
      "Attraction entry fees are not ours, we never quote them and we never collect them. They are paid at the gate, directly to the attraction, at the gate's own prices. What we quote is the transport, and that is the whole of what you owe us.",
      "Prices are quoted in United States dollars. Where a rate is marked indicative, we have not published a set price for that route and will confirm the exact figure before you pay anything.",
      "No fuel levy, no airport surcharge and no late-night premium is added to a confirmed price.",
    ],
  },
  {
    key: "pay",
    heading: "Paying",
    body: [
      "The booking form asks how you would like to pay, and both answers are equally fine with us.",
      "You can settle with your driver on the day, in cash, in United States or Jamaican dollars. This is how most of our guests pay and it is always available.",
      "Or you can pay when you book, by card, through PayPal's own secure checkout — no PayPal account is needed. Your card details are entered on their page and never reach this website. Paying online is never required, and choosing it changes nothing about the booking itself.",
      "We do not add a processing fee at checkout. The price you are shown is the price you are charged.",
    ],
  },
  {
    key: "cancel",
    heading: "Cancelling or changing a booking",
    confirm: true,
    body: [
      "You may cancel or change a confirmed booking free of charge up to 24 hours before the agreed pickup time. Tell us by WhatsApp, telephone or email and quote your PPP- reference.",
      "Inside 24 hours we will always try to move the booking rather than charge for it. Where a vehicle and driver have already been committed and cannot be reassigned, we may retain any amount already paid, up to 50% of the transport price.",
      "If you do not appear at the agreed pickup point and we cannot reach you on the number you gave us, after 60 minutes the booking is treated as a no-show and any amount paid is not refunded.",
      "We do not charge for changes we cause ourselves, and we do not charge for a cancellation arising from a flight cancellation outside your control.",
    ],
  },
  {
    key: "refunds",
    heading: "Refunds",
    confirm: true,
    body: [
      "Where a refund is due it is returned to the card that paid, in full, within 10 working days. We cannot refund to a different card or to cash.",
      "You are refunded in full, without exception, if we cannot service your confirmed date, if we cannot supply a vehicle, or if we cancel for any reason of our own.",
      "You are refunded in full for a cancellation made more than 24 hours before pickup.",
      "Attraction entry fees are never part of a refund from us, because we never collected them. Refunds of gate fees are a matter for the attraction.",
    ],
  },
  {
    key: "flights",
    heading: "Flights, delays and weather",
    confirm: true,
    body: [
      "Give us your flight number and we track the flight. If you land late, your driver waits, and there is no extra charge for a delay to a tracked flight.",
      "We ask for flight details at least 48 hours before arrival so a driver can be assigned. Later than that we will still do our best, but we cannot promise the vehicle class you asked for.",
      "Jamaica's weather occasionally closes an attraction — a river runs too high, a boat cannot sail. Where that happens we will offer an alternative for the same day or a full refund of the transport for the part not delivered. We do not control gate closures and cannot compensate for them beyond that.",
    ],
  },
  {
    key: "conduct",
    heading: "Vehicles, luggage and conduct",
    confirm: true,
    body: [
      "Every vehicle is inspected and insured for passenger service. Seat belts must be worn. Child seats are available on request — ask when you book, and tell us the child's age.",
      "Luggage allowance is what the vehicle class safely holds. Tell us in advance about golf bags, surfboards, wheelchairs or an unusual amount of luggage so we send the right vehicle.",
      "Our drivers may decline to carry a passenger whose behaviour is unsafe, or who is impaired to the point of being a risk to themselves or others. No refund is due where that happens.",
    ],
  },
  {
    key: "liability",
    heading: "Liability",
    confirm: true,
    body: [
      "We are liable for loss or injury caused by our own negligence, to the extent Jamaican law provides. Our liability for anything else arising from a booking is limited to the amount you paid us for it.",
      "We are not liable for anything an attraction, its staff or its own operators do, for gate closures, or for loss caused by events outside our reasonable control.",
      "You are strongly advised to hold your own travel insurance. It is the only thing that covers a trip cut short, a missed flight, or a medical cost on the island.",
      "Nothing here limits any right you have under Jamaican consumer law that cannot be limited by agreement.",
    ],
  },
  {
    key: "law",
    heading: "Governing law",
    body: [
      "These terms are governed by the laws of Jamaica, and the courts of Jamaica have jurisdiction over any dispute arising from them.",
      "This English text is the governing version. Translations elsewhere on this site are provided for convenience.",
    ],
  },
];

/** What the forms collect, why, and how long it is kept. */
export const privacyPolicy = [
  {
    key: "who",
    heading: "Who is responsible",
    body: [
      `${site.legalName}, ${site.address.line1}, ${site.address.line2}, ${site.address.city}, ${site.address.parish}, ${site.address.country}, is responsible for the personal data described here.`,
      `To ask anything about it, or to exercise any of the rights below, write to ${site.contact.email} or call ${site.contact.phone}.`,
    ],
  },
  {
    key: "what",
    heading: "What we collect, and only when you send it",
    body: [
      "The booking and enquiry forms collect your name, email address, telephone or WhatsApp number, the resort or address you are staying at, your travel dates and times, your flight numbers where you give them, your group size, and anything you type into the notes field.",
      "We collect that because we cannot meet you at an airport without it. It is the information needed to perform the booking you asked for.",
      "The site also stores your chosen resort in your own browser, so prices stay correct as you move between pages. That never leaves your device and we cannot read it.",
      "We do not run advertising trackers, we do not sell data, and we do not build profiles. There is no analytics cookie on this site.",
    ],
  },
  {
    key: "payment",
    heading: "Card details",
    body: [
      "If you pay online, your card number is entered on our payment provider's own secure page. It never passes through this website and we never see it or store it.",
      "What we keep is the fact of a payment: the amount, the currency, the provider's transaction reference and whether it succeeded. We need that to match a payment to your booking and to refund you if we have to.",
    ],
  },
  {
    key: "sharing",
    heading: "Who else sees it",
    body: [
      "Your driver is told what they need to collect you: your name, pickup point, time and telephone number.",
      "Bookings are stored with Google Firebase, and the alert that tells us a booking has arrived is sent through EmailJS. Both act on our instructions as processors.",
      "Where you have paid online, our payment provider processes the transaction.",
      "Nobody else. We do not pass your details to attractions, hotels or other operators unless doing so is part of the trip you booked, and we never share them for marketing.",
    ],
  },
  {
    key: "security",
    heading: "How it is protected",
    body: [
      "Bookings are written and read only by our own server. The database denies every request that does not come through it, so booking records are not reachable from a browser at all.",
      "Access to the booking console is restricted to named company accounts and requires a verified sign-in.",
    ],
  },
  {
    key: "keep",
    heading: "How long it is kept",
    confirm: true,
    body: [
      "Booking records are kept for 7 years, because they are the records of a completed transaction and Jamaican tax rules require us to be able to produce them.",
      "Enquiries that never became bookings are deleted after 24 months.",
      "Ask us to delete your details sooner and we will, except where we are required to keep a record of a transaction that actually happened.",
    ],
  },
  {
    key: "rights",
    heading: "Your rights",
    body: [
      "You can ask us for a copy of what we hold about you, ask us to correct it, or ask us to delete it. Write to the address above and we will answer within 30 days.",
      "If you are in the United Kingdom or the European Economic Area, the UK GDPR and the EU GDPR give you those rights and also the right to object to processing, to ask for it to be restricted, and to complain to your national data protection authority. We rely on the necessity of performing your booking as our lawful basis, not on consent, so there is nothing you need to agree to for us to drive you.",
      "You can withdraw a request at any time by cancelling the booking.",
    ],
  },
  {
    key: "children",
    heading: "Children",
    body: [
      "We carry children, and we ask their number and age so the right seats are fitted. We do not knowingly collect information directly from a child; a booking is made by the adult travelling with them.",
    ],
  },
];
