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
    // His own words (2026-11-02, revised the same evening), lightly polished.
    bio: "Educated in the melting pot of New York City, Mr. Pugh was exposed at an early age to cultural diversity, which had a major influence on the direction of PPP's mission from the very beginning. We keep it real with our customers and always make sure that our services have an authentic, homegrown, down-to-earth flavour, with a private, personalized, professional touch.",
    // His personal profile, not a company page — so it is the founder's
    // `sameAs` in schema.js, never the organization's.
    linkedin: "https://www.linkedin.com/in/donovan-pugh-8b1593170/",
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
    facebook: "https://www.facebook.com/ppptrantoursjamaica",
    instagram: "https://www.instagram.com/ppptrantoursjamaica/",
    tiktok: "https://www.tiktok.com/@ppp.transfer.tour",
    tripadvisor:
      "https://www.tripadvisor.com/Attraction_Review-g147311-d2343969-Reviews-PPP_Tran_Tours_Jamaica-Montego_Bay_Saint_James_Parish_Jamaica.html",
  },
  /*
   * "Leave a review" form for the Google Business Profile (supplied
   * 2026-10-22). Sent to guests after the trip — the admin panel's review
   * request — never before it: Google discourages asking ahead of the service.
   */
  reviewLinks: {
    google: "https://g.page/r/Cez1mmUHMeeyEBM/review",
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

/**
 * The three-P promise the company is named for, in the owner's wording
 * (2026-10-30). `title` is the line shown in "Why choose PPP"; `word` stays
 * the bare P-word because the About page and the dictionaries key on it.
 */
export const promise = [
  {
    letter: "P",
    word: "Private",
    title: "Private service only, always",
    body: "We don't do shared vehicles. Strictly private: just you and the people you enjoy, so you'll never end up placed on a bus with someone who spoils your energy.",
  },
  {
    letter: "P",
    word: "Personalized",
    title: "Personalized service",
    body: "We don't dictate, we accommodate, giving you total flexibility to set your own pickup time and schedule. Moving at your own pace is what a vacation is all about, and PPP helps you step into it just right!",
  },
  {
    letter: "P",
    word: "Professional",
    title: "Professional drivers",
    body: "Every PPP driver is handpicked by Mr. Pugh: patient, polite, punctual, very knowledgeable about Jamaica's history and culture, and licensed to operate islandwide.",
  },
];

/**
 * "Why choose PPP" on the homepage: the three P's, opened by the service
 * standard.
 */
export const whyChoose = {
  standard: {
    title: "5-star customer service",
    body: "A 5-star customer service standard, maintained for 15+ years.",
  },
};

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
  /*
   * Order is deliberate (2026-11-02): guests of every background alternate
   * all the way through, so the gallery reads as one PPP family rather than
   * runs of look-alike groups. The first three are the featured row; below
   * them the masonry fills each column top to bottom in list order (columns
   * are balanced by height), so alternating the list keeps every column
   * mixed, with a scenery shot about every third tile. Keep that rhythm when
   * adding photos.
   */
  {
    src: "/ppp/guests-van-beach.jpg",
    w: 1328,
    h: 747,
    place: "Beach day",
    caption: "Four friends, one PPP van, zero rush.",
    alt: "Four guests posing beside a PPP Tran Tours van",
  },
  {
    src: "/ppp/donovan-guests-ppp-tees.jpg",
    w: 1080,
    h: 1080,
    place: "Waterfall swim",
    caption: "Mr. Pugh with guests in their PPP tees.",
    alt: "Donovan Pugh with two guests in PPP Tran Tours caps and shirts above a turquoise river pool",
  },
  {
    src: "/ppp/guests-van-resort.jpg",
    w: 1080,
    h: 1080,
    place: "Resort pickup",
    caption: "Picked up at the door, family-style.",
    alt: "A family beside a PPP Tran Tours van outside a resort",
  },
  {
    src: "/ppp/guests-juici-patties.jpg",
    w: 1080,
    h: 1080,
    place: "Patty stop",
    caption: "First Jamaican patty, still hot.",
    alt: "A group of guests, one holding a baby, eating patties outside Juici Patties",
  },
  {
    src: "/ppp/guests-ricks-cafe.jpg",
    w: 1080,
    h: 1080,
    place: "Rick's Cafe, Negril",
    caption: "Under the famous sign, before the sunset.",
    alt: "Two guests under the Rick's Cafe sign in Negril",
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
    src: "/ppp/donovan-airport-van.jpg",
    w: 1001,
    h: 550,
    place: "Sangster International",
    caption: "Meeting guests at arrivals, luggage handled.",
    alt: "Donovan Pugh in uniform with four guests beside a PPP Tran Tours van at Sangster International Airport",
  },
  {
    src: "/ppp/guests-cruise-port-group.jpg",
    w: 960,
    h: 960,
    place: "Cruise port pickup",
    caption: "Straight off the ship, thumbs up all round.",
    alt: "A large group of cruise guests giving thumbs up outside the cruise port, their ship behind them",
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
    src: "/ppp/guests-zipline.jpg",
    w: 523,
    h: 260,
    place: "Zipline",
    caption: "Arms up, flying through the canopy.",
    alt: "A smiling guest in a pink top and helmet flying along a zipline through the forest",
  },
  {
    src: "/ppp/guests-beach-duo.jpg",
    w: 1070,
    h: 1338,
    place: "Beach day",
    caption: "Sun, sea and nowhere to be.",
    alt: "Two guests in sunglasses posing at the water's edge as a wave rolls in",
  },
  {
    src: "/ppp/guests-dunns-river.jpg",
    w: 1080,
    h: 1080,
    place: "Dunn's River Falls, Ocho Rios",
    caption: "Hand in hand up the falls.",
    alt: "A chain of guests holding hands as they climb the cascades at Dunn's River Falls",
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
    src: "/ppp/guests-river-ppp-tees.jpg",
    w: 830,
    h: 315,
    place: "River pool",
    caption: "PPP tees, cool water, good company.",
    alt: "Five guests, three in PPP Tran Tours shirts and caps, sitting together in a river pool holding the PPP sign",
  },
  {
    src: "/ppp/guests-bridal-party.jpg",
    w: 1080,
    h: 1080,
    place: "Bridal party",
    caption: "The bride and her crew, island-style.",
    alt: "A bride and four bridesmaids in matching tops on a wooden footbridge in a tropical garden",
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
    src: "/ppp/guests-airport-arrival.jpg",
    w: 1350,
    h: 758,
    place: "Sangster International",
    caption: "Landed, luggage in, driver waiting.",
    alt: "A smiling couple with their luggage beside a PPP Tran Tours van and their uniformed driver outside Sangster International Airport",
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
    src: "/ppp/guests-missionary-group.jpg",
    w: 960,
    h: 420,
    place: "Mission group",
    caption: "A whole team, moved together.",
    alt: "A large mission group in matching teal shirts with their PPP driver in a yellow PPP shirt beside a PPP-branded bus",
  },
  {
    src: "/team/donovan-group-waist.jpg",
    w: 1100,
    h: 560,
    place: "Montego Bay",
    caption: "Donovan Pugh, owner and driver since 2010.",
    alt: "Donovan Pugh, owner of PPP Tran Tours, standing with guests outside a resort in Montego Bay",
  },
  {
    src: "/ppp/guests-bamboo-bridge.jpg",
    w: 1080,
    h: 1080,
    place: "Rainforest walk",
    caption: "A bamboo bridge deep in the green.",
    alt: "A couple standing on a bamboo footbridge surrounded by bamboo and rainforest",
  },
  {
    src: "/ppp/guests-beach-mother-daughter.jpg",
    w: 1080,
    h: 1080,
    place: "Beach day",
    caption: "Clear water, little feet, no hurry.",
    alt: "A mother and her young daughter sitting together in clear, shallow turquoise water",
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
    src: "/ppp/banner-ys-falls.jpg",
    w: 1200,
    h: 400,
    place: "YS Falls, St. Elizabeth",
    caption: "Seven tiers of cold, clear water.",
    alt: "A couple in PPP Tran Tours caps and shirts standing in front of the tiered cascades at YS Falls",
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
    src: "/ppp/banner-sunset.jpg",
    w: 1200,
    h: 400,
    place: "West coast",
    caption: "The last run of the day, heading home.",
    alt: "The sun setting into a calm open sea, casting a gold path across the water",
  },
];

/**
 * Homepage photo reel — guests in PPP tees and caps, the vans, and Mr. Pugh.
 * Two rows that drift in opposite directions; all PPP's own photography
 * (supplied 2026-10-22). Tiles are cropped square, so only pick photos whose
 * subject survives a centred square crop, or give it a `focus` (a CSS
 * object-position) that keeps the subject in frame. Don't repeat the collage shots in
 * the reel. Three guest photos (van-beach, van-resort, ricks-cafe) also lead
 * the About gallery, at the owner's request (2026-10-30).
 */
export const brandReel = [
  // Guests of every background alternate along both rows (2026-11-02), so
  // the strip reads as one PPP family. Tiles are square crops: a photo under
  // ~400px on its short side, or a wide banner with people across its whole
  // width, goes soft or loses its subject here (it can still go in the About
  // gallery, which shows photos uncropped).
  [
    { src: "/ppp/horseback-trio-ppp.jpg", alt: "Three guests in PPP Tran Tours shirts riding horses through the sea" },
    { src: "/ppp/guests-van-resort.jpg", alt: "A family beside a PPP Tran Tours van outside a resort" },
    { src: "/ppp/donovan-guests-ppp-tees.jpg", alt: "Donovan Pugh with two guests in PPP Tran Tours caps and shirts above a turquoise river pool" },
    { src: "/ppp/guests-cruise-port-group.jpg", alt: "A large group of cruise guests giving thumbs up outside the cruise port" },
    { src: "/ppp/tee-portrait-beach.jpg", alt: "A smiling guest in a sun hat wearing the PPP Tran Tours shirt on the beach" },
    { src: "/ppp/guests-dunns-river.jpg", alt: "A chain of guests holding hands as they climb the cascades at Dunn's River Falls" },
    { src: "/ppp/guests-bridal-party.jpg", alt: "A bride and four bridesmaids in matching tops on a wooden footbridge" },
    { src: "/ppp/waterfall-ppp-sign.jpg", alt: "A guest under a waterfall holding a yellow PPP Tran Tours sign" },
    { src: "/ppp/guests-airport-arrival.jpg", alt: "A couple with their luggage beside a PPP Tran Tours van and their uniformed driver at Sangster International Airport" },
  ],
  [
    { src: "/ppp/guests-van-beach.jpg", alt: "Four guests posing beside a PPP Tran Tours van" },
    { src: "/ppp/ppp-cap-horse.jpg", alt: "A guest in a PPP Tran Tours cap and shirt beside a horse on the beach" },
    { src: "/ppp/guests-ricks-cafe.jpg", alt: "Two guests under the Rick's Cafe sign in Negril" },
    { src: "/ppp/guests-juici-patties.jpg", alt: "A group of guests, one holding a baby, eating patties outside Juici Patties" },
    { src: "/ppp/guests-bamboo-bridge.jpg", alt: "A couple standing on a bamboo footbridge in the rainforest" },
    { src: "/ppp/guests-beach-duo.jpg", alt: "Two guests in sunglasses posing at the water's edge as a wave rolls in" },
    { src: "/ppp/guests-missionary-group.jpg", alt: "A mission group in matching teal shirts with their PPP driver in a yellow PPP shirt" },
    { src: "/ppp/guests-beach-mother-daughter.jpg", alt: "A mother and her young daughter sitting together in clear, shallow turquoise water" },
    { src: "/ppp/tee-horseback-closeup.jpg", alt: "A guest in a PPP Tran Tours shirt riding a horse by the sea" },
  ],
];

/**
 * Verbatim Tripadvisor reviews. At most one that is mainly about Mr. Pugh
 * (owner, 2026-11-02): the rest should show PPP's service from different
 * angles, so the company never reads as a one-man operation.
 */
export const testimonials = [
  {
    quote:
      "PPP tours was amazing. Professional, knowledgeable and provided a rich cultural and fun experience. … PPP tours provided a luxury tour experience.",
    author: "Francis R.",
    date: "October 2023",
    source: "Tripadvisor",
  },
  {
    quote:
      "My family and I used PPP while visiting Jamaica on a cruise in August of 2022. Donovan was our driver and took us to the beach and to get some delicious food. We had a great day with him and learned so much!",
    author: "Katie",
    date: "February 2024",
    source: "Tripadvisor",
  },
  {
    quote:
      "They proved early on it would not be my last time patronizing them and it would be the first of many. … Immediately our Driver calculated a plan to get us to our destination safely even while being challenged by the heavy rain and near impossible visibility. It was excellence on display …",
    author: "Daren H.",
    date: "April 2022",
    source: "Tripadvisor",
  },
];

export const faqs = [
  {
    key: "entry",
    q: "Do your prices include the attraction entry fees?",
    a: "No, and that is deliberate. What you pay us is the transport and the guiding, and that single price is all we quote. Attraction admission is paid at the gate, straight to the attraction, at the gate's own price — we never resell it or add anything on top. Check the attraction's own prices before you go, so you know how much cash to carry.",
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
    a: "The booking form asks you, and both answers are fine with us: pay cash on arrival, in US dollars only, or pay the transport by card when you book, through PayPal's secure checkout — no PayPal account needed. Paying online is optional and changes nothing about your booking; pick cash and nothing is charged at all. Either way, attraction entry fees are paid at the gate and are never part of what we collect.",
  },
  {
    key: "confirm",
    q: "How do I know my booking went through?",
    a: "You get a booking reference the moment you submit, and on a route we publish a rate for, the booking is confirmed there and then — you are not waiting for us to accept it. Keep the reference; quoting it on any follow-up gets you an answer fastest. At the airport, your driver is the one holding the PPP company sign; for a departure, we set your hotel pickup from your flight time so you reach the airport a full two hours before it.",
  },
  {
    key: "delay",
    q: "What happens if my flight is delayed?",
    a: "Nothing, on your end. We track your flight number and adjust the pickup ourselves. Whenever you actually land, your driver will be waiting at the curb outside arrivals — Column E — holding the PPP company sign, at no extra charge.",
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
    a: "As early as you can. Airport transfers are easiest to guarantee when we have your flight details at least 48 hours ahead.",
  },
];

/**
 * Where an arriving guest meets their driver at Sangster International (MBJ),
 * in the owner's own words (2026-10-22). The guest-facing booking page and the
 * confirmation email both show it for any transfer with an arrival leg. The
 * translated versions live under `airportMeet` in each messages file; this is
 * the English source and the email's copy.
 *
 * The site used to promise a driver "inside the arrivals hall with a name
 * board". That is not where PPP meets guests — anyone following it would wait
 * indoors while their driver stood at the curb. Keep every mention of the
 * meeting point consistent with this.
 */
export const airportMeeting = {
  title: "Meeting your driver at Sangster International (MBJ)",
  steps: [
    "After customs, exit the terminal through the glass doors beside the taxi stand and turn left.",
    "Walk to the curb and look for your driver holding the PPP company sign at Column E.",
  ],
  help: "Can't spot us? Message us on WhatsApp and we'll come to you.",
};
