/**
 * Company facts, recovered from the previous ppptrantoursjamaica.com site
 * (Wayback snapshot 2026-01-22) and the TripAdvisor listing.
 * Everything user-facing that isn't a tour lives here so it's edited in one place.
 */

export const site = {
  name: "PPP Tran Tours",
  legalName: "PPP Tran Tours Jamaica",
  longName: "PPP Transfers & Tours Jamaica",
  tagline: "Private. Personalized. Professional.",
  descriptor:
    "Private airport transfers, island tours and cruise-pier excursions across Jamaica — run by trained professionals, priced without the resort markup.",
  founded: 2010,
  owner: {
    name: "Donovan Pugh",
    short: "Mr. Pugh",
    // Title as he signs it himself (from his email signature block).
    role: "Owner & Managing Director",
    bio: "A Jamaican educated in the melting pot of New York City, Donovan built PPP for travellers who crave homegrown Jamaican experiences and want to taste the richness of our passionate culture. He still drives most days.",
  },
  contact: {
    phone: "+1 (876) 397-6277",
    phoneHref: "tel:+18763976277",
    whatsapp: "18763976277",
    whatsappHref: "https://wa.me/18763976277",
    email: "info@ppptrantours.com",
    emailHref: "mailto:info@ppptrantours.com",
  },
  address: {
    line1: "108 Farm Heights",
    line2: "White Sands Beach",
    city: "Montego Bay",
    parish: "St. James",
    country: "Jamaica",
  },
  hours: "Dispatch answers 7 days a week, 6:00am – 10:00pm. Flights are met at any hour.",
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    tripadvisor:
      "https://www.tripadvisor.com/Attraction_Review-g147311-d2343969-Reviews-PPP_Tran_Tours_Jamaica-Montego_Bay_Saint_James_Parish_Jamaica.html",
  },
  rating: { score: "5.0", count: 680, source: "Tripadvisor" },
};

/** Headline numbers for the trust bar. */
export const stats = [
  { value: "5.0", label: "Tripadvisor rating", sub: `${site.rating.count} reviews` },
  { value: "15+", label: "Years on the road", sub: "Since 2010" },
  { value: "100%", label: "Private service", sub: "Never a shared van" },
  { value: "1,000+", label: "Guests driven", sub: "From 30+ countries" },
];

/** Licences and standards, straight from the old site's About page. */
export const credentials = [
  {
    title: "Licensed & regulated",
    body: "Licensed by the Jamaica Tourist Board and the Transport Authority of Jamaica. Every vehicle is inspected and insured for passenger service.",
  },
  {
    title: "Private only, always",
    body: "You never share a vehicle with strangers. No hotel-hopping pickup circuit, no waiting on a full van before you leave.",
  },
  {
    title: "Air-conditioned & maintained",
    body: "Clean, current, fully air-conditioned vehicles sized to your group — from a sedan for two to a coach for thirty.",
  },
  {
    title: "Drivers who know the island",
    body: "Patient, polite and knowledgeable. Our drivers are guides too, and they will tell you the story behind what you're looking at.",
  },
];

/** The three-P promise the company is named for. */
export const promise = [
  {
    letter: "P",
    word: "Private",
    body: "Your group, your vehicle, your schedule. Nobody else on board and no fixed departure time to make.",
  },
  {
    letter: "P",
    word: "Personalized",
    body: "Want two attractions in one day? A stop at a jerk pit on the way back? Combo days are no problem and reasonably priced.",
  },
  {
    letter: "P",
    word: "Professional",
    body: "Trained, licensed, insured. Flights tracked, pickups on time, and one number that always answers.",
  },
];

export const destinations = [
  {
    slug: "montego-bay",
    name: "Montego Bay",
    parish: "St. James",
    image: "/local/hero-1.jpg",
    blurb: "The Hip Strip, Rose Hall, Doctor's Cave and the island's busiest airport.",
  },
  {
    slug: "ocho-rios",
    name: "Ocho Rios",
    parish: "St. Ann",
    image: "/local/hero-3.jpg",
    blurb: "Dunn's River Falls, the Blue Hole, Dolphin Cove and Mystic Mountain.",
  },
  {
    slug: "negril",
    name: "Negril",
    parish: "Westmoreland",
    image: "/local/hero-4.jpg",
    blurb: "Seven Mile Beach, the West End cliffs and sunset at Rick's Cafe.",
  },
  {
    slug: "falmouth",
    name: "Falmouth",
    parish: "Trelawny",
    image: "/local/hero-6.jpg",
    blurb: "The cruise pier, the Luminous Lagoon and rafting the Martha Brae.",
  },
  {
    slug: "south-coast",
    name: "South Coast",
    parish: "St. Elizabeth",
    image: "/local/hero-7.jpg",
    blurb: "YS Falls, the Black River safari, Appleton Estate and Pelican Bar.",
  },
];

/** Verbatim Tripadvisor reviews. */
export const testimonials = [
  {
    quote:
      "Fantastic day with Mr. Pugh! Communication was great — so many laughs as he engaged us with stories and facts of Jamaican culture.",
    author: "Jocelyn S.",
    date: "August 2025",
    source: "Tripadvisor",
  },
  {
    quote:
      "The hospitality and care we received from Mr. Pugh was absolutely amazing. His attention to details and making sure we had a great experience was on point.",
    author: "Trevor H.",
    date: "May 2025",
    source: "Tripadvisor",
  },
  {
    quote:
      "Mr Pugh was professional, knowledgeable and very pleasant to be with. White River tubing was fun hanging out with native Jamaicans.",
    author: "Jamal B.",
    date: "January 2024",
    source: "Tripadvisor",
  },
  {
    quote:
      "PPP tours was amazing. Professional, knowledgeable and provided a rich cultural and fun experience.",
    author: "Francis R.",
    date: "October 2023",
    source: "Tripadvisor",
  },
  {
    quote:
      "Mr Pugh was so friendly, polite and professional all day long. We saw things you wouldn't normally see on trips.",
    author: "Debs T.",
    date: "November 2022",
    source: "Tripadvisor",
  },
  {
    quote:
      "Our driver calculated a plan to get us to our destination safely even while challenged by heavy rain and near impossible visibility.",
    author: "Daren H.",
    date: "April 2022",
    source: "Tripadvisor",
  },
];

export const faqs = [
  {
    q: "What payment methods do you accept?",
    a: "Mastercard, Visa and Visa Debit through our secure online checkout. We also accept pay-on-arrival in cash (USD or JMD) if you'd rather settle with your driver.",
  },
  {
    q: "How do I know my booking went through?",
    a: "You'll get an acknowledgement email with a booking reference the moment the request completes. Keep it — quoting that reference on any follow-up gets you an answer fastest. A separate confirmation follows once we've assigned your driver.",
  },
  {
    q: "I didn't receive a confirmation email.",
    a: "Check your spam or junk folder first, since acknowledgements are sent automatically and sometimes get filtered. If it isn't there, contact us and we'll confirm the booking by hand and check nothing failed on our side.",
  },
  {
    q: "What happens if my flight is delayed?",
    a: "Nothing, on your end. We track your flight number and adjust the pickup time ourselves. Your driver will be inside the arrivals hall with a name board whenever you actually land, at no extra charge.",
  },
  {
    q: "Is the vehicle private, or shared with other guests?",
    a: "Always private. Every PPP booking is your group alone — no shared vans, no pickup circuit around other hotels before you get moving.",
  },
  {
    q: "Can I combine two or three attractions in one day?",
    a: "Yes, and it's one of the things we're known for. Tell us what you want to see and we'll build the day around it and price it fairly. Customised combo tours are no problem.",
  },
  {
    q: "Are the prices per person or per group?",
    a: "Tour and transfer prices are shown per person, and the total updates as you add travellers on the booking form. Attraction entry fees are quoted separately, so you know exactly what's ours and what's the attraction's.",
  },
  {
    q: "How far in advance should I book?",
    a: "As early as you can. Our days sell out in high season, and airport transfers are easiest to guarantee when we have your flight details at least 48 hours ahead.",
  },
];

export const navLinks = [
  { href: "/tours", label: "All Tours" },
  { href: "/category/at", label: "Airport Transfers" },
  { href: "/destinations", label: "Destinations" },
  { href: "/about-us", label: "About PPP" },
  { href: "/contact-us", label: "Contact" },
];
