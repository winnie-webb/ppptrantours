# 05 — Copy Guidelines

## 1. Voice
Clear, helpful, confident, reassuring, human, direct. Mr. Pugh's warmth stays, but on About and in reviews, not between a guest and the Book button.

| Do | Don't |
|---|---|
| Say what happens: "Your driver waits inside arrivals with your name." | Brand statements in booking flows: "Approach Jamaica with confidence…" |
| Give the outcome: "$80 total for up to 4 people." | Explain the formula: "the total is based on the 4-person rate, so 1, 2, 3 or 4…" |
| One idea per sentence. 20 words max in flows. | Paragraphs in forms or cards |
| Use the guest's words: hotel, airport, price, pickup | Internal words: zone, band, rate card, pax, place, pier (unless it's a pier) |
| Reassure at the moment of doubt (next to price, next to submit) | Front-load reassurance before anything has been chosen |
| Specific CTAs: "Book transfer · $80" | Vague CTAs: "Book now", "Confirm this booking", "Submit" |

---

## 2. Glossary (canonical terms)

| Concept | Use | Avoid |
|---|---|---|
| The transfer product | **Airport transfer** | tour, trip, ride, transport |
| The tour product | **Tour** (plural "Tours") | Things to do, excursion (except SEO/meta), catalogue, experience |
| Combined tour | **Combo tour** | combo package, two-in-one |
| Where they sleep | **Hotel** (label "Where are you staying?"; placeholder "Search your hotel or resort") | place, zone, pickup point, resort (alone) |
| Airport | **Sangster International (MBJ)** on first mention, then "the airport" | Sangster alone, MoBay airport |
| Direction label | **Which way?** | Trip type, transfer type |
| Direction options | **Airport → hotel** · **Hotel → airport** · **Both ways** | Return, Round trip, One way (which way?) |
| Group size | **How many people?** / "2 people" | passengers, pax, guests (in forms) |
| Price | **Total** · "$80 total" | rate, fare, per head, per person (for transfers) |
| Gate fees | **Attraction entry** ("paid at the gate") | admission, entry components, gate fees (jargon) |
| Payment choice | **Pay the driver in cash** · **Pay now by card** | settle, settlement, cash-on-day |
| Booking ID | **Booking reference** | ref, ID |
| Help channel | **WhatsApp** (always name it) | "message us" (which channel?) |

---

## 3. Pricing language (one pattern, everywhere)

**Pattern:** `{$total} total{ · direction} — for up to 4 people. Each extra person +{$rate}.`

| Context | Copy |
|---|---|
| Before a hotel is chosen | "Choose your hotel to see your price." |
| Transfer price panel | "**$80** total · both ways" / "For up to 4 people. Each extra person +$20." |
| Party of 5+ | "**$100** total · both ways" / "For 5 people." |
| Tour card, no hotel known | "From **$40** for up to 4" |
| Tour card, hotel known | "**$60** from your hotel, for up to 4" |
| Rate list heading | "All transfer prices" / "Totals for up to 4 people." |
| Unlisted hotel (quote) | "We'll send your exact price within the hour." *(timing: owner)* |
| What's included (transfer) | "Private vehicle · Met inside arrivals · Flight tracked · No extra fees" |
| Not included (tours) | "Attraction entry isn't included. You pay it at the gate." |

**Banned:** "per person" on transfers. "/ person" on tour cards (pending Q-05). Any sentence explaining the minimum *before* a price is shown.

*(Q-05: owner to approve "total for up to 4" as the customer-facing framing. The arithmetic is unchanged.)*

---

## 4. CTA inventory (current → recommended)

| Where | Current | Recommended | Notes |
|---|---|---|---|
| Header (all pages) | Book now → WhatsApp | **Book a transfer** → /transfers | WhatsApp stays in the FAB |
| Hero | Explore tours (primary) / Book an airport transfer (ghost) | Two task cards: **See price** (transfer card) · **See tours** (tour card) | Equal weight |
| Homepage calculator | Book this transfer / Ask a question | removed (replaced by hero card) | |
| Transfer Stage 1 | — | **Continue · $80** | disabled until a hotel is chosen |
| Transfer submit | Confirm this booking | **Book transfer · $80** | |
| Transfer submit (card) | Book and pay now | **Book and pay · $80** | |
| Tour submit | Confirm this booking | **Book tour · $60** | |
| Before a hotel is chosen | Request a price | *(no submit shown; Stage 1 button disabled)* | F-38 |
| Unlisted hotel | — | **Send booking request** | |
| Sticky bar | Book now | **Book · $60** or **See your price** | |
| Tour card | whole card + arrow | **View tour** (visible text) | |
| Rail/section links | See all / See everything / Browse tours | **See all tours** | one phrase |
| Transfers link | All rates / See every transfer rate | **All transfer prices** | |
| FAB | (icon) "Chat with us" | **Chat on WhatsApp** (aria-label) | |
| Confirmation | Confirm on WhatsApp / Browse more tours | **Message us on WhatsApp** / **See tours** | |
| Contact form | Send message | **Send message** (keep) | |

---

## 5. Key rewrites (en.json)

**Note for i18n.** When a string's *meaning* changes, add a **new key** rather than editing in place, as the codebase already does (`ratesTotalDescription`). Otherwise the 9 other locales keep stale translations that contradict the English. English is the priority; other locales can fall back to the code defaults until they are translated.

| Key (current) | Current | Recommended |
|---|---|---|
| `hero.h1a/h1b` + `lead1/lead2` | "Approach Jamaica with confidence…" + 40-word PPP paragraph | H1 **"Private airport transfers and tours in Jamaica"** · sub: **"Based in Montego Bay. Licensed. Your group only."** |
| `fare.destination` | Which resort are we taking you to? | **Where are you staying?** |
| `fare.choose` | Choose your hotel or resort… | **Search your hotel or resort** |
| `fare.chooseFirst` / `fare.prompt` | Choose your resort and the rest of the booking appears here, price included. | **Choose your hotel to see your price.** |
| `booking.autoNote` / `fare.noteTotal` | 45-word minimum explanation | **delete** (replaced by the price-panel qualifier) |
| `booking.tripType` | Trip type | **Which way?** |
| `booking.roundTrip` / `fare.roundTrip` | Round trip / Return | **Both ways** |
| `booking.oneWay` | One way | **Airport → hotel** + new **Hotel → airport** |
| `booking.transferTo` | To {hotel} (12px faint) | *(replaced by selected-hotel card)* |
| `booking.submit` | Confirm this booking | **Book transfer · {price}** / **Book tour · {price}** |
| `booking.requestQuote` | Request a price | **Send booking request** (unlisted only) |
| `booking.pickResortHint` | Tell us which resort you're staying at and the exact price for your group appears here. | **Choose your hotel to see your price.** |
| `booking.notesPlaceholder` (transfer) | Car seats, extra stops, a second attraction you'd like to add… | **Car seats, extra luggage, anything else** |
| `booking.doneBody` | Keep it — quoting it gets you an answer fastest. Your driver and exact pickup time follow by WhatsApp or email shortly. | **We've emailed your confirmation to {email}. We'll message you on WhatsApp with your driver's name before pickup.** *(timing: owner)* |
| `place.subtitle` | Pick your resort and every price on the site becomes yours — no zones to work out. | **Type your hotel's name.** |
| `place.noMatch` | No match. Pick the closest resort, or tell us in the notes — we cover the whole island. | **No match for "{q}".** + button **My hotel isn't listed** |
| `place.footnote` | Not on the list? Choose the nearest one to get an idea of the price, then message us… | **delete** (replaced by the "isn't listed" path) |
| `home.transfersDescription` | …a rate per person… | **delete** (section removed) |
| `nav.book` | Book now | **Book a transfer** |
| `nav.tours` | Things to do | **Tours** |
| Tour page rating line | 5.0 · 680 reviews (next to the tour title) | **PPP on Tripadvisor: 5.0 (680 reviews)**, in the reviews block |
| `cta.body` | Our days sell out in high season… we'll come back with a plan and a price | *(contradicts instant booking; remove or align after Q-08)* |
| `contactPage.sendDescription` | No payment is taken here — we confirm availability and price first. | **For anything not on the site: groups, weddings, custom days. We reply within the hour.** |

---

## 6. Microcopy standards
- **Errors** say what's wrong and how to fix it, in 14px, next to the field:
  - "Enter your arrival date."
  - "Choose today or a later date."
  - "Enter an email like name@example.com."
  - "Departure can't be before arrival."
- **Required fields:** "* required" once at the top. Optional fields that matter get a reason, e.g. "WhatsApp (so your driver can reach you)".
- **Helper text** only where people genuinely hesitate:
  - flight number: "We track your flight, so delays cost nothing."
  - pickup time: per Q-02 / Q-10
- **Numbers:** always "$" with USD stated once near totals ("All prices in US dollars"). No "US$" in one place and "$" in another.
- **Dates:** show chosen dates back in a clear format, e.g. "Fri 12 Dec".
- **No exclamation marks, no emojis** in flows. The 🇯🇲 flag belongs in marketing only, if anywhere.
- **Trust claims** must be true and attributable. The company rating must be labelled as the company's, and "sell out" and "confirmed instantly" can't both be said (Q-08).
