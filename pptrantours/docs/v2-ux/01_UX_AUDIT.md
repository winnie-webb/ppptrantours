# 01 — UX Audit: PPP Tran Tours (English site)

**Date:** 2026-09-23 · **Build audited:** `master` @ `885f1d6` · **Scope:** public English site. Admin console and non-English locales are out of scope (locales are scaling infrastructure for later).

**Method**
1. Read the templates that generate every page (not each of the ~570 generated pages): `app/[locale]/**`, `app/components/**`, `app/data/**`, `app/products/**`, `lib/**`, `app/i18n/messages/en.json`.
2. Walked the live dev build at **375 × 812 (phone)** and measured rendered sizes, colours and positions in the browser.
3. Traced booking data from form → `/api/bookings` → Firestore → payment → confirmation.

**DIY flow:** there is none in the code, UI or git history. The closest things are the 7 fixed combo tours and a "Build my day" button that opens WhatsApp. DIY is **out of scope** by decision. The typography complaint that came with it (headings weaker than subheadings) is real, though. It is in the booking form, and it's covered below as **F-40**.

---

## Issue classification

| Tag | Meaning |
|---|---|
| **UX** | The interaction or flow is confusing |
| **UI** | The visual design is confusing |
| **Content** | The wording is confusing |
| **A11y** | Hard to perceive or operate |
| **Logic** | The underlying flow doesn't match what users expect |
| **Data** | The hotel, location or pricing data is missing |
| **Arch** | The technical structure makes the right experience hard to build |

Severity:
- **S1** blocks or derails a booking
- **S2** causes hesitation or errors
- **S3** friction or polish

---

## 1. What exists today (facts)

| Area | Reality |
|---|---|
| Products | Airport transfers from **Sangster (MBJ) only**. 24 tours (17 excursions + 7 combos) sold as transport only; gate fees are paid at the attraction. |
| Hotels | **48 hard-coded places** in `app/data/places.js` (46 with a transfer price, 2 cruise piers without). Montego Bay has 22 entries. Negril has **2 generic entries** and no named resorts. There are 10 aliases, no coordinates and no database or API. |
| Transfer price | `rate × max(4, people)` (`app/products/pricing.js:82`). Each hotel has its own one-way rate, and round trip is exactly 2×. Children pay full rate. |
| Tour price | Each tour has a per-person rate for each of 8 pickup zones; a hotel maps to a zone. Same 4-person minimum. |
| Booking | One component, `BookingForm.jsx` (1,427 lines), serves both tours and transfers. The booking is saved server-side and the price is recomputed on the server. Payment is cash on the day (default) or card through PayPal. |
| Confirmation | Reference shown on screen. **Only the owner gets an email.** The guest gets no email, and the success screen is lost on reload. |
| Directions | Transfers are airport→hotel one way, or round trip. **Hotel→airport only can't be booked.** |
| Analytics | None installed. Conversion can't be measured today. |
| Pages | Home, /tours, /category/[7], /tour/[24], /transfers, /transfer/[46], /destinations, /about-us, /contact-us, /booking/[ref], /terms, /privacy |

---

## 2. Top 12 findings (fix these first)

| # | Finding | Class | Sev |
|---|---|---|---|
| F-10 | **Transfer hotel choice is a native `<select>` of 46 hotels with no search.** On a phone it opens the OS picker wheel, grouped by area names a visitor may not know. It is not the searchable picker the rest of the site uses. | UX | S1 |
| F-11 | **The selected hotel is nearly invisible.** After choosing, the form confirms it only as "To Iberostar Joia Rose Hall" in **12px text at 45% opacity**. The select itself scrolls away. The user can't easily verify what they chose. | UI | S1 |
| F-12 | **Many real hotels aren't in the data.** Searching "Hyatt" returns "No match" (Hyatt Ziva/Zilara Rose Hall are major MoBay resorts). Negril is 2 generic rows. Villas and Airbnbs have no path at all. | Data | S1 |
| F-13 | **Unlisted hotel = dead end.** There is no "My hotel isn't listed" option. The copy says "pick the closest and tell us in the notes", so the guest books the *wrong* hotel on purpose and the price is wrong. | Logic | S1 |
| F-14 | **Hotel→airport (departure-only) transfers can't be booked.** A guest who arranged their own arrival has to book a round trip or a one-way *from* the airport. | Logic | S1 |
| F-20 | **Transfers are buried on the homepage.** The hero's primary button is "Explore tours". The first place to get a transfer price is **~3,000px down** on a phone (3.7 screens), below a tour rail and category grid. | UX | S1 |
| F-21 | **The header's "Book now" opens WhatsApp**, not a booking. The label promises one thing and does another, and it competes with the on-site booking. | Content/UX | S2 |
| F-30 | **The pricing story contradicts itself.** Homepage: "a rate per person". /transfers: "One fare for up to four", then "not per head". FAQ: "Per person, with a four-person minimum". Search: "from $5 one way", while tables say $20. Tour cards: "$10 / person", but a couple pays $40. | Content | S2 |
| F-31 | **Pricing is explained before it matters.** A 45-word note about the 4-person rule opens every booking form, before the guest has entered anything. | Content | S2 |
| F-40 | **Backwards heading hierarchy in the booking form.** Section headings ("Your trip", "Who's coming") are **10.9px Fraunces at 40% opacity**, smaller and fainter than the 12px field labels beneath them. | UI/A11y | S2 |
| F-50 | **No guest confirmation email, and the success screen is lost on reload.** Cash bookers never get a link to their booking. Guests are left unsure whether it worked. | Logic/Arch | S2 |
| F-60 | **About 85 text uses fall below WCAG AA contrast** (ink at 55% opacity or lighter on white), including tour-card subtitles, price qualifiers, helper text and footnotes. | A11y | S2 |

---

## 3. Findings by area

### 3.1 Homepage and first impression

- **F-20** Transfers are secondary (see above). `Hero.jsx` makes "Explore tours" gold and primary, and "Book an airport transfer" a ghost button. An arriving traveller's most urgent job is getting from the airport.
- **F-22** The homepage is **16,966px tall on a phone (≈21 screens)**, with 11 sections: tour rail, categories, fare calculator, combos, transparency, promise, stats, testimonials, gallery, destinations, FAQ, CTA band and slogan. About 950 words of section copy. · Content · S3
- **F-23** It repeats itself:
  - 5.0 / 680 reviews appears 4 times.
  - "Approach Jamaica with confidence" opens and closes the page.
  - Private/Personalized/Professional appears 3 times.
  - The combo pitch appears twice.

  Repetition pushes the booking tools down without adding new information. · Content · S3
- **F-24** The hero paragraph (40 words, with gold uppercase PRIVATE / PERSONALIZED / PROFESSIONAL) is a brand statement. It doesn't say plainly "we drive you from the airport to your hotel, and take you on tours". · Content · S3
- **F-25** "Airport Transfers" appears as one of the tiles under "Things to do in Jamaica", which files a transport service as an activity. · Content/IA · S3
- **F-26** Hero copy promises pickups "from all major hotels and cruise ports", but cruise piers can't be chosen for transfers. They're filtered out of every transfer picker. · Content/Logic · S2

### 3.2 Navigation and information architecture

- **F-21** Header "Book now" goes to WhatsApp (`Header.jsx:234`), on desktop and in the mobile menu.
- **F-27** Naming drift for the same concept:
  - Tours are called "Things to do", "Explore tours", "Tours", "Browse", "The catalogue" and "See everything".
  - Transfers are called "Airport transfers", "Transfers", "Book an airport transfer", "All rates" and "See every transfer rate".

  · Content · S3
- **F-28** The mobile menu lists "Airport transfers" 3 times. It has no Escape key, no focus trap and no `role="dialog"`, and the hamburger has no `aria-expanded`. · UX/A11y · S3
- **F-29** `/destinations` overlaps with the region category pages (`/category/montego-bay`, etc.). It's another browse path with the same tours. · IA · S3
- **F-2A** The "Where are you staying?" chip in the header (`PlaceChip`) is hidden on mobile except inside the menu, and **it doesn't affect transfers**. Picking a hotel there doesn't pre-fill /transfers. · Arch/UX · S2

### 3.3 Airport transfer flow

Today there are **three different transfer entry experiences**:

| Entry | Hotel control | What happens |
|---|---|---|
| Homepage `FareCalculator` | native select + Return/One way + passengers | Shows the total, then "Book this transfer" goes to `/transfer/[hotel]`, which asks again inside the form |
| `/transfers` `TransferBooking` | native select | Choosing a hotel reveals the full form below and scrolls to it |
| `/transfer/[hotel]` (46 SEO pages) | hotel fixed; no way to change it in the form | The form only; switching means using the "nearby resorts" chips |

Findings:
- **F-10, F-11, F-12, F-13, F-14** (above).
- **F-15** Two widgets with different wording and defaults: "Return" vs "Round trip", "Passengers" vs "Adults/Children". · Arch/Content · S3
- **F-16** The hotel label reads "Which resort are we taking you to?". It assumes a resort, which excludes villa, guesthouse and Airbnb guests. "Resort", "hotel" and "pier" are used interchangeably across the site. · Content · S3
- **F-17** The return leg asks for "Return date" and "Return flight" but **no hotel pickup time**. Who decides when the driver collects the guest for their departure isn't stated. · Logic · S2 (needs owner rule)
- **F-18** The price box shows "Round trip **$80**". It doesn't say "for 2 people" or "for up to 4", or what's included. · UI/Content · S2
- **F-19** `/transfers` puts a **46-row price list** below the form. On a phone that's 46 cards. It's the business's rate sheet, not a decision aid. It helps transparency and SEO, but on the booking page it competes with the form. · Content · S3
- **F-1A** Tap targets: the passenger steppers are **32 × 32px** (measured), and the trip-type toggles are about 36px. · A11y · S2
- **F-1B** The form defaults to round trip and 2 adults. Round trip is a sensible default, but it isn't explained ("arrival and departure"). "One way" doesn't say which way. · Content · S2

### 3.4 Hotel selection (tours use a different picker)

Tours use `PlacePicker`, a searchable bottom-sheet modal. That's the right idea, but:
- **F-70** Its trigger looks like a disabled text input with a tiny red "Choose" link. The field has no required marker, although it is required. · UI · S2
- **F-71** Search is a plain substring match on "name + area + aliases":
  - word order matters ("joia iberostar" finds nothing)
  - there is no typo tolerance
  - accents and punctuation aren't normalised

  · UX/Data · S2
- **F-72** Opening the sheet auto-focuses the search, so the phone keyboard covers half the list immediately. As the user types, the sheet shrinks and the input jumps down the screen (observed). · UI · S3
- **F-73** The picker has no listbox semantics, no arrow-key navigation, no focus trap, and focus isn't returned to the trigger on close. The close button is 36px. · A11y · S2
- **F-74** The sheet subtitle "every price on the site becomes yours — no zones to work out" introduces a concept (zones) in order to say you don't need to know it. · Content · S3
- **F-75** The remembered-hotel check ("Check this is still right / Yes / No, change it") is a sound safety step. It adds a tap, but it prevents a wrong-hotel booking. **Keep, but lighten** (see 07). · UX · S3

### 3.5 Pricing

- **F-30, F-31, F-18** (above).
- **F-32** Tour cards show "From $10 / person" without the 4-person minimum. A couple then sees $40 in the form. The per-person rate is a real figure, but it creates a surprise at the worst moment. · Content/Logic · S2
- **F-33** The code already calculates everything automatically and correctly, and the server re-prices every booking. **The pricing *system* is sound; the pricing *communication* is the problem.**

### 3.6 Tours discovery

- **F-34** `/tours` has chips, a keyword search, 3-way sort and **pagination at 12 per page, for 24 tours**. That's more controls than the catalogue needs. · UX · S3
- **F-35** Cards carry a region badge, duration, title, subtitle (xs, 40% opacity), a 3-line description, price and an arrow. The description and subtitle add density without helping the choice. · UI · S3
- **F-36** Every tour detail page shows **"5.0 · 680 reviews"** next to the tour name. That's the *company's* Tripadvisor rating presented as if it were the tour's. · Content (trust) · S2
- **F-37** The tour form's "Pickup time" is optional with no guidance. Is it the guest's preference or the driver's decision? · Logic · S2
- **F-38** Before a hotel is chosen, the tour submit button reads **"Request a price"**. It's misleading, because validation then demands a hotel anyway. · Content · S2

### 3.7 Booking form and checkout

The form is one long page: about 10 fields and **~1,650px, two phone screens**, with sections for Trip, Who's coming, Details and Pay.

What works:
- validation on blur and on submit
- the first error gets focus
- 16px inputs, so iOS doesn't zoom
- idempotent submit
- server-side pricing

Problems:
- **F-40** Backwards heading hierarchy (above).
- **F-41** Date and time sit side by side at every width, so on a 375px phone the date field truncates ("dd/mm/yy…"). · UI · S3
- **F-42** There's no booking summary before submit. The price sits in the middle of the form, and hotel, date, direction and people are never recapped next to the button. · UX · S2
- **F-43** "How you'll pay" renders as a heading with nothing under it when card payments aren't configured (observed locally). · UI · S3
- **F-44** Booking terms and cancellation aren't shown or linked in the form. The policies in `app/data/policies.js` are flagged `confirm: true`, meaning drafts the owner hasn't approved. · Content/Logic · S2
- **F-45** Error messages are 12px. · A11y · S3
- **F-50** No guest confirmation email, and the success state isn't persistent (above).
- **F-51** Availability: bookings are auto-confirmed with deliberately no capacity check. But the CTA says "Our days sell out in high season" and the contact page says "we confirm availability and price first". The site contradicts itself about whether a booking is guaranteed. · Content/Logic · S2
- **F-52** Children are charged the full rate and no ages are asked, yet the privacy policy says children's ages are collected. · Content · S3

### 3.8 Typography, visual system and accessibility

Fonts load correctly: Plus Jakarta Sans for body, Fraunces for headings (verified computed styles).

- **F-40** Backwards hierarchy in the form (above).
- **F-61** Every `h1`–`h3` inherits Fraunces globally (`globals.css:26`). Small functional headings therefore render as tiny serif caps: form sections, picker groups, footer columns, the /transfers promise cards ("Met inside arrivals" at 14px serif).
- **F-62** There's no type scale. 38 one-off sizes (`text-[0.65rem]`, `[0.68rem]`, `[0.7rem]`) sit below 12px.
  - On /tour pages the h1 is 30px on mobile, the same size as section h2s.
  - The slogan `<p>` (64px) and stats numbers are larger than any h2.
- **F-60** Low-contrast text (above). Examples:
  - TourCard subtitle (xs, ink/40, ≈2.7:1)
  - "/ person" (ink/45)
  - FareCalculator note (xs, ink/45)
  - form section headings (ink/40)
  - picker group labels (ink/40)
- **F-63** Focus: `focus-visible` rings exist only on `.btn`. The header "Book now", the WhatsApp button, cards, nav, FAQ and the language switcher rely on browser defaults. `.field` uses `focus:` with a 10%-opacity ring. · A11y · S2
- **F-64** There's no skip link. Search inputs (header search, picker, tour filter) have placeholders but no labels. · A11y · S2
- **F-65** FAQ answers are hidden with opacity only, so screen readers still read the collapsed answers. There's no `aria-controls`. · A11y · S3
- **F-66** The WhatsApp floating button is white on #25D366, about 2:1. The hero slide dots are 4px tall. · A11y · S3
- **F-67** Uppercase 12px labels (`.label`) throughout the forms. Uppercase at small sizes slows reading. · UI · S3

---

## 4. Before / after (major flows)

### Homepage
| | |
|---|---|
| **Current** | Brand hero (tours primary) → tour rail → category grid → transfer calculator at ~3,000px → 8 more sections. About 21 phone screens. |
| **Problem** | The two things people come to do aren't presented as two clear choices. The transfer tool is 3.7 screens down, and repetition delays everything. |
| **Recommended** | The hero states the offer in one line and gives **two equal task cards: "Airport transfer" (with the hotel search inline) and "Tours"**. Then popular tours → one trust strip (rating + licence + "private only") → 3-step "how it works" → short FAQ → footer. The brand story moves to About. |
| **Reason** | Intent is captured in the first screen. Every section left on the page moves someone toward a booking. |
| **Implementation** | Rewrite `app/[locale]/page.js` and `Hero.jsx`. Remove `TransparencyBand`, `PromiseSection`, `StatsBar`, `GallerySection`, `DestinationsGrid`, `SloganBand` and `CtaBand` from the homepage (keep the components for About). New `TransferQuickStart` built on the shared hotel search (see 08). |

### Transfer booking
| | |
|---|---|
| **Current** | Three entry widgets. Native select. Form reveals below. The selected hotel is faint 12px text. Direction options can't express departure-only. |
| **Problem** | The user must find their hotel in a 46-item wheel, can't see what they picked, and can't book a departure-only trip. |
| **Recommended** | One `TransferBooking` everywhere. **Stage 1 "Get your price":** hotel search → "Which way?" (Airport → hotel / Hotel → airport / Both ways) → people → price appears instantly. **Stage 2 "Book it":** flight details for the chosen direction(s), contact details, how to pay, summary and one button: "Book transfer · $80". |
| **Reason** | It matches the mental model (where am I going → how much → book), keeps the price visible, and removes the impossible direction. |
| **Implementation** | Refactor `TransferBooking.jsx` and the transfer branch of `BookingForm.jsx`. Delete `FareCalculator.jsx`. Add `direction` to the booking payload and API validation. The /transfer/[place] pages pre-fill the same component. |

### Hotel selection
| | |
|---|---|
| **Current** | Native select (transfers) and a substring-search modal (tours). Two separate systems. "Hyatt" finds nothing. No unlisted path. |
| **Problem** | It's easy to miss and hard to search, gives weak confirmation, and has data gaps. |
| **Recommended** | One `HotelSearch` combobox, used everywhere and backed by `PlaceProvider`. Word-order- and typo-tolerant search. Popular suggestions before typing. A large, unmistakable selected card with a "Change" button. **"My hotel isn't listed"** leads to choosing an area plus typing the property name. Expanded hotel data. See **07**. |
| **Reason** | Search beats scrolling. Confirmation beats guessing. A fallback beats a dead end. |
| **Implementation** | New `app/components/HotelSearch.jsx` and `app/data/hotel-search.js`. Extend the `places.js` schema. Replace both `<select>`s and `PlacePicker`'s list. |

### Pricing
| | |
|---|---|
| **Current** | Four different framings across the site. The rule is explained up front. The price box doesn't say who it covers. |
| **Problem** | Guests must reconcile "per person", "flat for four" and "not per head" themselves. |
| **Recommended** | One sentence, everywhere: **"$80 total for up to 4 people · +$20 for each extra person."** It is shown only *after* a hotel is chosen, next to the price. Before that: "Choose your hotel to see your price." |
| **Reason** | The outcome, not the formula. The system does the maths. |
| **Implementation** | One `formatPriceLine()` helper in `pricing.js`, a single en.json key set, and removal of `autoNote` / `noteTotal`. |

### Tour discovery
| | |
|---|---|
| **Current** | Chips + search + sort + pagination for 24 tours. Dense cards. A company rating shown as if it were each tour's. |
| **Problem** | More controls than choices. Card text is noise at browse stage. The trust signal is misleading. |
| **Recommended** | Region chips only, all 24 tours on one page. Cards show image, title, duration, "From $40 for up to 4" and a "View tour" link. On detail pages the rating is labelled "PPP Tran Tours on Tripadvisor". |
| **Implementation** | `TourGrid.jsx` (drop pagination and sort, keep search behind chips or drop it), `TourCard.jsx`, `TourPrice.jsx`, `tour/[id]/page.jsx`. |

### Checkout and confirmation
| | |
|---|---|
| **Current** | Long form, no summary, no terms link, no guest email, non-persistent success screen. |
| **Recommended** | A summary card directly above the submit button, a terms link next to the button, a **guest confirmation email**, and a redirect after submit to `/booking/[ref]?p=token` for *every* booking (cash too), showing the full details. The draft is kept in sessionStorage. |
| **Implementation** | `BookingForm.jsx`, `app/api/bookings/route.js`, `lib/notify.js` plus a guest template in `lib/email/templates/`, and `booking/[reference]/page.jsx`. |

### DIY
Not applicable. No DIY flow exists, and it's out of scope by decision.

---

## 5. What to keep

These already work and must survive the redesign:
- Server-side re-pricing (`/api/bookings` ignores the client total).
- Idempotent booking keys.
- The PayPal settle checks.
- Validation on blur and on submit, with focus moving to the first error.
- 16px inputs on mobile.
- Mobile card layout for the rate list.
- Sticky "Book now" bar that hides when the form is visible.
- The remembered-hotel confirmation (lighter).
- The "transport only, gates paid at the attraction" transparency. It's a genuine differentiator, but it should be said once and briefly.

---

## 6. Open business questions (do not guess — owner must answer)

| # | Question | Why it matters |
|---|---|---|
| Q-01 | Can guests book **hotel → airport only**? Is it priced the same as airport → hotel? | Required for F-14 |
| Q-02 | For the departure leg, **who sets the hotel pickup time**: the guest, or PPP from the flight time? | F-17 |
| Q-03 | **Unlisted hotels, villas, Airbnbs:** can a price be given by area (instant), or must it always be a manual quote? | F-13, 07 |
| Q-04 | Hyatt Ziva/Zilara, Negril resorts and others: **which properties do you serve, and at what rate?** | F-12, 07 |
| Q-05 | Customer-facing price framing: **"$X total for up to 4, +$Y each extra"** for transfers *and* tours. OK? | F-30, F-32 |
| Q-06 | Children and infants: full rate? Car seats available, and at what cost? | F-52 |
| Q-07 | Cancellation, refund and no-show policy: approve the drafts in `policies.js`? | F-44 |
| Q-08 | Bookings are auto-confirmed with no capacity check. Is that true in practice, or is manual confirmation needed in peak season? | F-51 |
| Q-09 | Cruise piers: are **pier transfers** offered? Kingston (KIN) airport? | F-26 |
| Q-10 | Tour pickup time: guest preference or PPP-assigned? | F-37 |
| Q-11 | Cash in JMD: what exchange rate is used? | Trust |
| Q-12 | Is a flight number **required** for airport pickups (the draft terms say 48h ahead)? | Form rules |

---

## 7. Final UX gate — current product

| Question | Today | Why |
|---|---|---|
| Can a first-time user immediately understand what PPP does? | **Partly** | The hero is brand-first. "Transfers and tours" is buried in a 40-word paragraph. |
| Can they tell a transfer from a tour? | **Partly** | Transfers are listed as a "Things to do" tile, and naming drifts. |
| Can they easily start an airport transfer booking? | **No** (mobile) | Secondary CTA, calculator 3.7 screens down, header "Book now" opens WhatsApp. |
| Can they easily find their hotel? | **No** | 46-item native select for transfers. Substring search for tours. Data gaps (Hyatt, Negril). |
| Is the hotel-selection interaction unmistakable? | **No** | The selected state is faint 12px text. The tour trigger looks disabled. |
| Does selecting a hotel say pricing is automatic? | **Partly** | A pre-emptive 45-word note, not reassurance at the moment of selection. |
| Can users understand the price without knowing the system? | **No** | Four contradicting framings. The price box doesn't say who it covers. |
| Is there always an obvious next action? | **Mostly** | Within the form yes. Across the site, "Book now" is ambiguous. |
| Can the core booking flow be done comfortably on a phone? | **Partly** | 32px steppers, truncated date, 2-screen form with no summary. |
| Is the typography hierarchy logical? | **No** | Form headings are smaller and fainter than labels. No type scale. |
| Can users comfortably read the interface? | **Partly** | About 85 sub-AA text instances, and many sub-12px sizes. |
| Are important controls accessible? | **Partly** | Missing focus rings, labels, dialog semantics and a skip link. |
| Is unnecessary information removed? | **No** | 21-screen homepage, 46-row rate list on the booking page, repeated claims. |
| Does every major piece of content serve the current task? | **No** | The brand story sits between the user and the booking tools. |
| Does the interface reduce uncertainty? | **Partly** | The contradictions about price, availability and confirmation add doubt. |
| Does it feel like it helps the user book? | **Partly** | The engine is excellent; the surface makes the user do the interpreting. |

The redesign in docs 02–08 is designed to turn every row into **Yes**. The owner answers in §6 are the only blockers that can't be solved in code.
