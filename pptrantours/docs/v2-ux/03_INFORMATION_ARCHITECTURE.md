# 03 — Information Architecture

## Principle
PPP sells two different things, and the structure should never mix them:

| | **Airport transfers** | **Tours** |
|---|---|---|
| What it is | A ride between Sangster airport and your hotel | A private day out with pickup from your hotel |
| User's key input | Hotel + flight | Hotel + date |
| Decision driver | Price, reliability | Appeal, price, duration |
| Name in UI | "Airport transfers" | "Tours" |

Everything else (About, Contact, FAQ, policies) is support.

---

## 1. Sitemap (recommended)

```
/                         Home — choose: Airport transfer | Tours
/transfers                Book an airport transfer (the booking tool IS the page)
  /transfer/[hotel]       SEO landing per hotel → same tool, hotel pre-filled
/tours                    All tours (region chips, incl. Combos)
  /tour/[id]              Tour detail + booking
  /category/[region]      Keep as SEO landing pages (same grid, chip pre-selected)
/booking/[reference]      Booking status & details (persistent, emailed)
/about-us                 Story, owner, fleet, gallery, promise, stats, testimonials (moved here from Home)
/contact-us               Channels + enquiry form + full FAQ
/terms  /privacy
```

**Removed or merged**
- `/destinations`: redirect to `/tours`. Its region tiles duplicate the region chips and category pages (F-29).
- `/category/transfers`: already redirects. Keep.
- "Airport Transfers" tile inside "Things to do": remove (F-25).

---

## 2. Navigation

**Mobile header (always visible)**
```
[Logo]                                   [ Book a transfer ]  [☰]
```
- One primary header CTA: **"Book a transfer"**, linking to `/transfers`. It is a *site* action, not WhatsApp (F-21). It's the right default because transfers are the time-critical purchase, and tours have their own CTA on every tour page.
- On `/transfers` and `/transfer/*` the header CTA changes to **"Tours"** (secondary style), so it never duplicates the page's own primary action.

**Menu (mobile sheet / desktop bar)**
```
Airport transfers
Tours
About
Contact
────────
WhatsApp +1 (876) 397-6277      (secondary, with icon)
Language: English ▾             (footer on mobile; later)
```
- Each item appears **once** (the menu currently shows "Airport transfers" 3 times, F-28).
- The region list moves out of the menu. Regions are chips on /tours.
- The "Where are you staying?" chip is removed from the header. The hotel is asked where it changes something (booking card, tour list), and is remembered by `PlaceProvider`.
- The header search (tours + hotels) is removed from the header and menu. Tours are few enough to browse, and hotels are searched inside the booking tool. *(Revisit if analytics show search usage.)*

**Floating WhatsApp button**
- Keep it, relabelled for screen readers as "Chat on WhatsApp".
- On mobile it is hidden while a booking form field is focused or the sticky book bar is visible, so it never overlaps a primary action.

**Footer**
- Airport transfers · Tours (+ regions) · About · Contact & FAQ · Booking terms · Privacy · licence line · contact details.

---

## 3. Homepage structure

| # | Section | Purpose | Primary action |
|---|---|---|---|
| 1 | **Hero** — H1: "Private airport transfers and tours in Jamaica". Sub: "Montego Bay-based. Licensed. Your group only." Two task cards side by side (stacked on mobile) | Capture intent in the first screen | Card 1 "Airport transfer": inline hotel search, then `See price`. Card 2 "Tours": `See tours` |
| 2 | Trust strip — ★ 5.0 on Tripadvisor (680) · Licensed by JTB & TA · Private vehicles only · Since 2010 | Confidence | — |
| 3 | Popular tours (rail of 6–8) | Tour discovery | `See all tours` |
| 4 | How it works — 3 steps: Choose your hotel → See your price → Book, pay the driver or by card | Remove uncertainty about the process | — |
| 5 | 3 short review quotes | Social proof | `Read reviews on Tripadvisor` |
| 6 | FAQ (4: price, delays, payment, not-listed hotel) | Answer blockers | `More questions` → /contact-us |
| 7 | Footer | | |

Target: **about 6 phone screens** (today it's about 21). Moved to About: promise, stats band, gallery, fleet, the owner's story. Removed: slogan band, a duplicate CTA band, the transparency band. Its one essential claim, "transport only, gate fees paid at the attraction", becomes one line on tour pages and one FAQ.

---

## 4. /transfers page structure
1. H1 "Airport transfers" + one line: "Sangster International (MBJ) to your hotel, private and flight-tracked."
2. **The booking tool** (02 §1).
3. What's included (4 items, compact, 2×2).
4. FAQ (3 transfer-specific).
5. **"All transfer prices"**: collapsed by default (`<details>`), searchable by the same hotel search. It stays for transparency and SEO but stays out of the decision path (F-19).

## 5. /tour/[id] page structure
Title, region and duration → photo → price line → included/not-included → **booking card** (on mobile it follows the photo; the sticky bar "Book · from $40" scrolls to it) → about → highlights → reviews (company, labelled) → related.

---

## 6. Labels and terminology (IA-level)
| Concept | Use | Don't use |
|---|---|---|
| Transfer product | Airport transfer | Tour, trip, transport product |
| Direction choice (label) | **Which way?** | Trip type |
| Direction options | Airport → hotel · Hotel → airport · Both ways | Return, Round trip, One way |
| Tour catalogue | Tours | Things to do, catalogue, excursions (except SEO copy) |
| Where the guest stays | Hotel (label: "Where are you staying?") | Resort (alone), zone, pickup point, place |
| Price | Total for your group | Rate, fare, per head |

The full glossary is in `05_COPY_GUIDELINES.md`.
