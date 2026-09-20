/**
 * Company facts, recovered from the previous ppptrantoursjamaica.com site
 * (Wayback snapshot 2026-01-22) and the TripAdvisor listing.
 * Everything user-facing that isn't a tour lives here so it's edited in one place.
 */

export const site = {
  /*
   * Canonical origin. The 2014 domain, not ppptrantours.com — it carries twelve
   * years of backlinks and the Tripadvisor references, and the other domain
   * redirects to it.
   *
   * Overridable by SITE_URL so a tunnel can stand in during local testing of
   * anything that needs an absolute callback URL. No trailing slash: every
   * caller concatenates a path that starts with one.
   */
  url: (process.env.SITE_URL || "https://ppptrantoursjamaica.com").replace(
    /\/+$/,
    ""
  ),
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
    /*
     * The Gmail, not info@ppptrantours.com.
     *
     * That domain address was on Yandex Mail and was blocked for inactivity, so
     * every enquiry the site invited a guest to send there was landing nowhere.
     * This is the inbox the business actually reads, and it is already where
     * the new-booking alert is delivered.
     *
     * Worth replacing with info@ppptrantoursjamaica.com once DNS is recovered
     * and a mailbox exists on it — but a plain Gmail that gets answered beats a
     * branded address that does not.
     */
    email: "ppptrantours@gmail.com",
    emailHref: "mailto:ppptrantours@gmail.com",
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
    /*
     * Facebook and Instagram are bare domains because no PPP account was ever
     * found. They are NOT rendered while they look like this — Footer filters
     * anything that is just a platform root, so the icons simply do not appear.
     * Drop a real profile URL in and the icon shows up on its own.
     */
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    tripadvisor:
      "https://www.tripadvisor.com/Attraction_Review-g147311-d2343969-Reviews-PPP_Tran_Tours_Jamaica-Montego_Bay_Saint_James_Parish_Jamaica.html",
  },
  rating: { score: "5.0", count: 680, source: "Tripadvisor" },
};

/** Headline numbers for the trust bar. */
export const stats = [
  {
    key: "rating",
    value: "5.0",
    label: "Tripadvisor rating",
    sub: `${site.rating.count} reviews`,
  },
  { key: "years", value: "15+", label: "Years on the road", sub: "Since 2010" },
  {
    key: "private",
    value: "100%",
    label: "Private service",
    sub: "Never a shared van",
  },
  {
    key: "guests",
    value: "1,000+",
    label: "Guests driven",
    sub: "From 30+ countries",
  },
];

/** Licences and standards, straight from the old site's About page. */
export const credentials = [
  {
    key: "licensed",
    title: "Licensed & regulated",
    body: "Licensed by the Jamaica Tourist Board and the Transport Authority of Jamaica. Every vehicle is inspected and insured for passenger service.",
  },
  {
    key: "private",
    title: "Private only, always",
    body: "You never share a vehicle with strangers. No hotel-hopping pickup circuit, no waiting on a full van before you leave.",
  },
  {
    key: "aircon",
    title: "Air-conditioned & maintained",
    body: "Clean, current, fully air-conditioned vehicles sized to your group — from a sedan for two to a coach for thirty.",
  },
  {
    key: "drivers",
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

/**
 * Gallery — deliberately drawn *only* from PPP's own photography
 * (`public/ppp/` and `public/team/`, see `public/CREDITS.md`). The Wikimedia
 * scenery in `public/local/` is CC BY / CC BY-SA and would need visible
 * attribution on the page, so none of it is used here.
 *
 * `w`/`h` are the true pixel dimensions of each file. The gallery is a masonry
 * layout that renders every photo at its native ratio, so nothing is cropped —
 * which matters because the recovered banners are an extreme 3:1 and would lose
 * their subject in a uniform grid.
 */
export const gallery = [
  {
    src: "/ppp/donovan-airport-van.jpg",
    w: 1001,
    h: 550,
    place: "Sangster International",
    caption: "Meeting guests at arrivals, luggage handled.",
    alt: "Donovan Pugh in uniform with four guests beside a PPP Tran Tours van at Sangster International Airport",
  },
  {
    src: "/ppp/banner-waterfall-guests.jpg",
    w: 1200,
    h: 400,
    place: "Waterfall stop",
    caption: "Guests in PPP tees, cooling off mid-tour.",
    alt: "Three guests in PPP Tran Tours shirts and caps sitting on rocks beside a waterfall",
  },
  {
    src: "/team/donovan-portrait.jpg",
    w: 780,
    h: 1040,
    place: "Montego Bay",
    caption: "Donovan Pugh, owner and driver since 2010.",
    alt: "Donovan Pugh, owner of PPP Tran Tours, standing with guests outside a resort in Montego Bay",
  },
  {
    src: "/ppp/banner-craft-market.jpg",
    w: 1200,
    h: 400,
    place: "Craft market",
    caption: "Wood carvings, straight from the carver.",
    alt: "A smiling craft market vendor holding a woven bag, surrounded by carved wooden faces and figures",
  },
  {
    src: "/ppp/river-tubing.jpg",
    w: 700,
    h: 550,
    place: "River tubing",
    caption: "Drifting under the old stone bridge.",
    alt: "Three guests floating on yellow tubes down a green river beneath a moss-covered stone arch bridge",
  },
  {
    src: "/ppp/banner-fisherman-mobay.jpg",
    w: 1200,
    h: 400,
    place: "Montego Bay",
    caption: "The morning catch, still dripping.",
    alt: "A fisherman on the shore at Montego Bay holding up two strings of red snapper, cruise ship behind him",
  },
  {
    src: "/ppp/banner-ys-falls.jpg",
    w: 1200,
    h: 400,
    place: "YS Falls, St. Elizabeth",
    caption: "Seven tiers of cold, clear water.",
    alt: "A couple in PPP Tran Tours caps and shirts standing in front of the tiered cascades at YS Falls",
  },
  {
    src: "/ppp/mystic-mountain.jpg",
    w: 600,
    h: 400,
    place: "Ocho Rios, St. Ann",
    caption: "Bobsledding down through the canopy.",
    alt: "Two guests riding bobsleds down a rainforest track above Ocho Rios harbour with a cruise ship below",
  },
  {
    src: "/ppp/ricks-cafe.jpg",
    w: 674,
    h: 446,
    place: "Negril, Westmoreland",
    caption: "Rick's Cafe — cliff divers and rum punch.",
    alt: "Crowds gathered on the limestone cliffs at Rick's Cafe in Negril",
  },
  {
    src: "/ppp/banner-jerk-pit.jpg",
    w: 1200,
    h: 400,
    place: "Roadside jerk pit",
    caption: "Pimento wood, slow smoke, no rushing.",
    alt: "A cook in a yellow shirt turning jerk pork over a smoking open grill at a roadside jerk pit",
  },
  {
    src: "/ppp/banner-sunset.jpg",
    w: 1200,
    h: 400,
    place: "West coast",
    caption: "The last run of the day, heading home.",
    alt: "The sun setting into a calm open sea, casting a gold path across the water",
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
    key: "pricing",
    q: "Are your prices per person or per vehicle?",
    a: "Per vehicle. One published price covers the whole group up to four people, so two travellers and four travellers pay exactly the same for the transport. From the fifth passenger on, each one adds a small fixed amount that is shown next to every rate.",
  },
  {
    key: "entry",
    q: "Do your prices include the attraction entry fees?",
    a: "No, and that is deliberate. What you pay us is the transport and the guiding. Entry fees are paid at the gate, straight to the attraction, and we never resell them or add anything on top. Every tour page lists the gate prices beside ours so you can see the true cost of the day and know how much cash to carry.",
  },
  {
    key: "quote",
    q: "Why does the price change depending on my hotel?",
    a: "Because the driving does. A day at Dunn's River from a Falmouth resort is a shorter run than the same day from Grand Palladium, so it costs less. Tell the site where you are staying and every price you see becomes the real price for you.",
  },
  {
    key: "notlisted",
    q: "My resort isn't on your list. Can you still collect me?",
    a: "Yes. We cover the whole island. The published rates are for the resorts and piers we serve most often; anywhere else, send us the address and we will quote it the same day at the same kind of price.",
  },
  {
    key: "payment",
    q: "How and when do I pay?",
    a: "The booking form asks you, and both answers are fine with us: settle with your driver on the day in cash, US or Jamaican dollars, or pay the transport by card when you book, through PayPal's secure checkout — no PayPal account needed. Paying online is optional and changes nothing about your booking; pick cash and nothing is charged at all. Either way, attraction entry fees are paid at the gate and are never part of what we collect.",
  },
  {
    key: "confirm",
    q: "How do I know my booking went through?",
    a: "You get a booking reference the moment you submit, and on a route we publish a rate for, the booking is confirmed there and then — you are not waiting for us to accept it. Keep the reference; quoting it on any follow-up gets you an answer fastest. Your driver and exact pickup time follow separately, usually within the hour during dispatch hours.",
  },
  {
    key: "delay",
    q: "What happens if my flight is delayed?",
    a: "Nothing, on your end. We track your flight number and adjust the pickup ourselves. Your driver will be inside the arrivals hall with a name board whenever you actually land, at no extra charge.",
  },
  {
    key: "shared",
    q: "Is the vehicle private, or shared with other guests?",
    a: "Always private. Every PPP booking is your group alone — no shared vans, no pickup circuit around other hotels before you get moving.",
  },
  {
    key: "combo",
    q: "Can I combine two or three attractions in one day?",
    a: "Yes, and it is one of the things we are known for. Most of our combo tours are in the same region, no more than a 20–30 minute drive apart, so you can do both on the same day and we only charge a little more for the transport and the waiting. Tell us what you want to see and we will build the day around it.",
  },
  {
    key: "group",
    q: "How large a group can you take?",
    a: "Any size, big or small. Vehicles run from a sedan for two up to a coach for thirty. Tell us the number and we will put the right vehicle on it.",
  },
  {
    key: "advance",
    q: "How far in advance should I book?",
    a: "As early as you can. Our days sell out in high season, and airport transfers are easiest to guarantee when we have your flight details at least 48 hours ahead.",
  },
];
