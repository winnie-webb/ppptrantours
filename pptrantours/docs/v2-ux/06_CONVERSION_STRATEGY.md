# 06 — Conversion Strategy

**Objective:** more completed bookings, measured, not assumed. There is **no analytics on the site today**, so step 0 is to measure the baseline.

---

## 1. Funnel map (current state)

| Stage | User goal | Current primary CTA | Friction | Unneeded content | Terminology | Trust concerns | A11y / mobile | Abandonment risk |
|---|---|---|---|---|---|---|---|---|
| **Landing** (Home, SEO pages) | "Is this what I need?" | Explore tours (tours-first) | Transfers secondary; 21 phone screens | Slogan, repeated rating ×4, PPP ×3, promise, gallery | "Things to do" vs tours | Stats flagged unverified in README | Hero dots 4px; low-contrast subtitles | **High** for transfer seekers |
| **Intent** (transfer vs tour) | "Where do I start?" | Header "Book now" → WhatsApp | Header CTA leaves the site; transfers filed under "Things to do" | Category tile for transfers | Naming drift | — | Mobile menu has no dialog semantics | Medium |
| **Selection** (hotel / tour) | "Find my hotel / pick a tour" | Native select / picker modal / "View" | 46-item wheel; no word-order or typo matching; missing hotels; unlisted = dead end | 46-row rate list on the booking page | Resort / hotel / place / pier | "Pick the closest" invites a wrong booking | 32px steppers; picker lacks listbox semantics | **Highest** (reported real-user failure) |
| **Details** | "Tell them when and who" | — | No departure-only; truncated date on 375px; no pickup-time rule | 45-word pricing note up front | Trip type, Return / Round trip | — | Headings 10.9px @ 40% | Medium |
| **Price** | "How much, really?" | — | Four contradictory framings; price box doesn't say who it covers | — | Per person / flat / not per head | Card "$10/person" becomes $40 | Price not announced to screen readers | **High** (surprise) |
| **Booking** | "Commit with confidence" | Confirm this booking | No summary, no terms link | Empty "How you'll pay" heading | "Confirm this booking" | Auto-confirm vs "we confirm availability first" | 12px errors | Medium |
| **Confirmation** | "Did it work? What now?" | Confirm on WhatsApp | No guest email; lost on reload | — | — | No record in the guest's inbox | — | Post-booking anxiety → WhatsApp load, no-shows |

---

## 2. Highest-impact opportunities (ranked)

Score = impact on completed bookings (H/M/L) against effort (S/M/L). Rank 1 is the highest priority.

| # | Opportunity | Fixes | Impact | Effort | Depends on |
|---|---|---|---|---|---|
| 1 | **Shared hotel search** (search, not a select), a big selected card, and a "My hotel isn't listed" path | F-10, F-11, F-13, F-70–F-74 | **H** | M | — |
| 2 | **Hotel data expansion** (Hyatt, Negril, the missing MoBay properties) + aliases | F-12 | **H** | M (mostly owner time) | Q-04 |
| 3 | **Transfer tool first on the homepage** (hero task cards) + header "Book a transfer" | F-20, F-21 | **H** | S–M | — |
| 4 | **One price sentence** shown with the price, not before it | F-30, F-31, F-18, F-32 | **H** | S | Q-05 |
| 5 | **Direction options, including Hotel → airport** | F-14, F-17 | **H** for that segment | S–M | Q-01, Q-02 |
| 6 | **Summary + terms link before submit; specific CTA with price** | F-42, F-44, F-38 | M | S | Q-07 for the terms text |
| 7 | **Guest confirmation email + persistent booking page for all bookings** | F-50 | M (trust, fewer "did it work?" messages) | M | email transport (Resend) |
| 8 | **Type and contrast fixes** (form headings, labels, muted text) | F-40, F-60–F-62 | M | S | — |
| 9 | **Tap targets, focus, dialog semantics** | F-1A, F-28, F-63–F-66, F-73 | M | S | — |
| 10 | **Homepage cut to ~6 screens**, brand content moved to About | F-22–F-24 | M | S | — |
| 11 | **Tours: remove sort and pagination, simplify cards, fix rating labelling** | F-34–F-36 | L–M | S | — |
| 12 | **Draft persistence** (sessionStorage) | lost progress | L–M | S | — |

**Do 1–4 first.** Together they fix the reported failure (hotel selection) and the biggest drop-off risk (transfers buried, price confusion).

---

## 3. Measurement plan (Phase 0: before changing the UI)

**Tool:** a privacy-friendly, cookieless analytics tool (e.g. Plausible or Vercel Web Analytics) is enough, and it avoids a consent banner. Firebase Analytics is already in the stack but sets cookies and would need consent. **Owner and dev to choose. Don't add a paid service without approval.**

**Events** (name → properties):

| Event | When | Properties |
|---|---|---|
| `transfer_start` | Transfer tool first interaction | entry: home / transfers / transfer_page |
| `hotel_search` | Debounced query submitted | query length, result count (not the query text if privacy is a concern; otherwise the text, to find missing hotels) |
| `hotel_no_results` | Zero results shown | **query text**: the single most useful signal for data gaps |
| `hotel_selected` | Hotel chosen | hotel key, source: search / popular / remembered |
| `hotel_unlisted` | "Isn't listed" chosen | area |
| `price_shown` | Price panel first rendered | product type, total |
| `stage2_open` | Continue pressed | product type |
| `form_error` | Validation error on submit | field |
| `booking_submitted` | API success | product type, total, payment choice |
| `booking_failed` | API failure | status |
| `payment_completed` | Capture success | amount |
| `whatsapp_click` | Any WhatsApp link | location |

**KPIs**
- Transfer funnel: `transfer_start` → `hotel_selected` → `price_shown` → `stage2_open` → `booking_submitted`.
- Tour funnel: tour page view → `hotel_selected` → `booking_submitted`.
- **Hotel search success rate** = `hotel_selected` / `hotel_search` sessions. Target > 90%.
- **Zero-result rate**, reviewed weekly to add hotels and aliases.
- WhatsApp-instead-of-form rate (an indicator of form distrust, not necessarily bad).
- Mobile vs desktop completion.

**Qualitative:** before launch, run 5 moderated tests on phones with people who have never seen the site. Task: "You land at MBJ on 12 Dec and are staying at Hyatt Ziva Rose Hall; book your ride." Success = booked in under 2 minutes, without help, and able to say the price and who it covers.

---

## 4. Trust levers (cheap, real, no clutter)
- The **company** rating, labelled as the company's, in one place per page.
- **Licence line** (JTB & Transport Authority) near the booking button, as one line.
- **"Driver waits inside arrivals with your name · flight tracked"** next to the transfer price. This is the #1 transfer anxiety.
- **"Pay the driver in cash"** as the default. It lowers commitment risk; keep it.
- **Cancellation terms** linked next to the submit button, once the owner approves them (Q-07).
- A **confirmation email** in the inbox.

Things that are **not** trust levers here: stats that can't be verified (README flags "1,000+ guests" and "30+ countries" as unverified), repeating the rating four times, and slogans.
