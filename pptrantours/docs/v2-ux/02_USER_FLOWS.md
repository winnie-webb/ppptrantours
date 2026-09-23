# 02 — Recommended User Flows

Finding IDs (F-xx) and owner questions (Q-xx) refer to `01_UX_AUDIT.md`. DIY is out of scope, because no such flow exists.

**Rule for every screen.** It must answer: what am I looking at, what can I do, what must I choose, what happens next, how much, and what's the next action. Each step below lists its **one primary action**.

---

## 1. Airport transfer

### Mental model
| | |
|---|---|
| **User goal** | "Get me from the airport to my hotel (and back) without hassle." |
| **Expectation** | Tell them my hotel and flight, see the price, book, and know someone will be there. |
| **Current behaviour** | Choose from a 46-item native dropdown. The form appears. The chosen hotel is shown in faint text. The rule for groups of four is explained before anything else. Departure-only can't be booked. |
| **Friction** | Finding the hotel (F-10, F-12), confirming it (F-11), direction (F-14), price framing (F-30), no summary (F-42) |
| **Solution** | Two stages: **Get your price** (hotel, direction, people), then **Book it** (flights, contact, pay, summary). |
| **Confidence** | Hotel name shown large with a tick. The price states who it covers. "Driver waits inside arrivals with your name · flight tracked" beside the price. Confirmation email. |

### Recommended flow

**Entry points** (all open the same component):
- Homepage "Airport transfer" card
- Header "Book a transfer"
- `/transfers`
- `/transfer/[hotel]`, which arrives with the hotel pre-filled

```
Stage 1 · Get your price  (one card, fits one phone screen)
  1. Where are you staying?      [ 🔍 Search your hotel            ]
                                  → full-screen search sheet (see §4)
                                  → selected card: "Iberostar Joia Rose Hall ✓  Montego Bay   [Change]"
  2. Which way?                  ( Airport → hotel ) ( Hotel → airport ) ( Both ways ✓ default )
  3. How many people?            [ − ]  2  [ + ]    (one number; children counted the same — Q-06)
  ─────────────────────────────────────────────────────────────
  Price panel (appears the moment 1 is answered; updates live):
     $80  total · both ways
     For up to 4 people. Each extra person +$20.
     ✓ Met inside arrivals   ✓ Flight tracked   ✓ Private vehicle
  Primary:  [ Continue · $80 ]
  Before a hotel is chosen, the panel says: "Choose your hotel to see your price."

Stage 2 · Book it  (same page, revealed below; Stage 1 collapses to a summary line with "Edit")
  Arrival      (if Airport → hotel or Both)   Date*  ·  Flight number*(Q-12)  ·  Landing time
  Departure    (if Hotel → airport or Both)   Date*  ·  Flight number  ·  Flight time
               Helper: "We'll tell you your hotel pickup time." (or a pickup-time field — Q-02)
  Your details  Name* · Email* · WhatsApp/phone (recommended: "so your driver can reach you")
  Notes (optional)  placeholder: "Car seats, extra luggage, anything else"
  How to pay    (●) Pay the driver in cash   ( ) Pay now by card      (only if card enabled)
  Summary card  Iberostar Joia Rose Hall · Both ways · 2 people · Arr 12 Dec (AA 1573) · Dep 19 Dec
                Total $80 · Pay the driver on the day
                By booking you agree to the booking terms (link)
  Primary:  [ Book transfer · $80 ]

Confirmation  → /booking/PPP-XXXXXX?p=token  (persistent; also emailed to guest)
  "You're booked." + summary + "What happens next: we message you on WhatsApp 24 h before
   with your driver's name." (timing — owner to confirm) + [Pay now by card] if they chose card and haven't paid
```

**Error-proofing**
- The hotel is required before Stage 2 can open, so the form can't be submitted without it.
- Only the date fields for the chosen direction(s) appear.
- A departure date before the arrival date gets an inline error.
- A past date is blocked by the date input's `min`.
- If the hotel is changed in Stage 1 after Stage 2 is filled, the price updates and **the rest of the form is kept** (current behaviour, keep it).
- The draft is saved to `sessionStorage`, so a reload or back-navigation doesn't lose it.

**Unlisted hotel**
- "My hotel isn't listed" at the bottom of the search goes to *Choose area* (the 6 areas), then *Property name or address* (free text).
- If owner Q-03 allows area pricing, show "About $X — we'll confirm within the hour." If not, the price panel reads "We'll send your exact price within the hour" and the button reads **"Send booking request"**.
- The API records `placeKey: null, customPlace: {area, text}` with `status: "new"`, not `confirmed`.

---

## 2. Tours

### Mental model
| | |
|---|---|
| **User goal** | "Find something great to do and book it for a specific day." |
| **Expectation** | Browse appealing options, see roughly what it costs, open one, pick a date, and book. |
| **Current behaviour** | 24 tours behind chips, search, sort and pagination. Dense cards. "$10 / person" then becomes $40 in the form. The hotel picker is a modal. A company rating is shown as the tour's. |
| **Friction** | Too many controls (F-34), card density (F-35), price surprise (F-32), trust (F-36), pickup-time ambiguity (F-37) |
| **Solution** | Simple browse, honest "from" price, and a detail page with the same two-stage booking as transfers. |
| **Confidence** | What's included and not included (gate fees) in one line. Duration. Pickup from your hotel. Real reviews labelled correctly. |

### Recommended flow
```
/tours  "Tours"  (H1)   one line: "Private tours with pickup from your hotel."
  Region chips: All · Montego Bay · Ocho Rios · Falmouth · Negril · South Coast · Combos
  All 24 cards on one page, sorted by popularity (owner's popular flag first)
  Card: photo · title · duration · "From $40 for up to 4"* · [View tour]
      *after a hotel is known: "$60 from your hotel for up to 4"

/tour/[id]
  Photo · Title (H1) · Region · Duration
  Price line (same helper as transfers)
  "Included: private vehicle & driver-guide, hotel pickup and drop-off.
   Not included: attraction entry — pay at the gate (about $X, check with attraction)."  ← one block
  About (≤ 80 words) · Highlights (4 bullets)
  Booking card:
    Stage 1  Hotel (same HotelSearch) · Date · People → price panel → [Continue · $60]
    Stage 2  Details · Pickup time (per Q-10: "Preferred pickup time" or "We'll confirm your pickup time") ·
             How to pay · Summary · [Book tour · $60]
  Reviews: "PPP Tran Tours on Tripadvisor — 5.0 (680)" (company, labelled as such)
  3 related tours
```
Combos stay as products in the same grid, as a "Combos" chip. "Build my day" (WhatsApp) stays on the combos view only, as a secondary link.

---

## 3. Booking and checkout (shared by both)

| Step | Screen content | Primary action | Guard |
|---|---|---|---|
| Stage 1 | Hotel, direction or date, people, live price | `Continue · $X` | Disabled until the hotel is chosen (with helper text saying why) |
| Stage 2 | Only the fields the product needs; payment choice; summary; terms link | `Book transfer · $X` / `Book tour · $X` / `Send booking request` | Inline validation (keep current), focus moves to first error |
| Card payment (optional) | PayPal inline buttons, as now | PayPal's own | Server derives the amount (keep) |
| Confirmation | Persistent `/booking/[ref]` page with full summary, next steps, WhatsApp link | `Message us on WhatsApp` (secondary: `Pay now by card` if unpaid and wanted) | Same page reached from the confirmation email |

**Button labels are specific and include the price.** "Confirm this booking", "Request a price" (before a hotel is chosen) and "Book now" are removed.

**Failure paths**
- **Save fails** (5xx or network): keep today's WhatsApp fallback. The headline "Not confirmed yet" is correct.
- **Card fails:** "Your booking is saved. Nothing was charged." Then [Try again] or [Pay the driver instead].

---

## 4. Hotel selection (component flow)

Full specification in `07_HOTEL_SELECTION.md`. The flow:

```
Field (idle)        Label "Where are you staying?"  [ 🔍 Search your hotel or resort ]   48px tall, full width
Tap              →  Full-screen sheet (mobile) / anchored dropdown (desktop)
                    Search input focused, keyboard up
                    Empty query: "Popular" (8 most-booked) + "Browse by area" list
                    Typing: results update per keystroke, each row = name (16px) + area (14px)
                    No results: "No match for 'xyz'." + [My hotel isn't listed]
Select           →  Sheet closes, focus returns to field
                    Field becomes Selected card:  ✓ Iberostar Joia Rose Hall
                                                    Rose Hall, Montego Bay        [Change]
                    Price panel animates in:  "$80 total …"
                    (screen-reader live region: "Iberostar Joia Rose Hall selected. Price $80.")
Remembered hotel →  Pre-filled Selected card with a small line "From your last visit" — no blocking confirm step;
                    the summary card before submit is the confirmation.
```

---

## 5. What was deliberately **not** added
- No map, no filters or sort inside hotel search, no multi-page wizard with its own URLs, no account or login, no live availability calendar. None of these is needed to fix the observed failures. Revisit only if post-launch data shows a need.
