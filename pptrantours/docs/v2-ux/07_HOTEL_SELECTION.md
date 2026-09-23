# 07 — Hotel Selection

A real guest couldn't work out how to select their hotel. This document treats that as a **serious usability failure** with three causes:
- **interaction:** it's easy to miss and hard to search
- **feedback:** the chosen hotel is barely visible
- **data:** the hotel may not be in the list at all, and there's no way forward when it isn't

---

## 1. Investigation: the current hotel data

| Question | Answer (evidence) |
|---|---|
| Where does hotel data come from? | Hard-coded array `PLACES` in `app/data/places.js:93-155`. Hand-maintained from the owner's price list. |
| How many hotels? | **48 places**: 46 hotels or areas with a transfer price, plus 2 cruise piers (`transfer: null`). |
| By area | Montego Bay 22 · Falmouth & Trelawny 7 · Hanover & Green Island 5 · Ocho Rios & St. Ann 9 · **Negril 2 (generic: "Negril beach hotels", "Negril West End hotels")** · South Coast 1 · Piers 2 |
| Manually maintained? | Yes. Changes need a code deploy. There's no admin UI for hotels. |
| API? | None. |
| Database? | None for hotels. Firestore is used for bookings only. |
| How are hotels mapped to destinations? | Each record has `area` (display grouping, 7 areas) and `zone` (1 of 8 **tour** price zones). |
| How are transfer prices calculated? | **Directly per hotel**: `transfer: { oneWay, roundTrip }`, per person, with total = `rate × max(4, people)` (`pricing.js:70-96`). Round trip is always 2× one way. Zones aren't used for transfers. |
| Aliases? | Yes, `aka[]` on 10 records (e.g. "FDR", "Decameron", "cliffs"). |
| Nearby hotels? | No. There are no coordinates or addresses; `area` is the only proximity signal. |
| What happens when a hotel is missing? | **Nothing that works.** The copy says "Pick the closest resort, or tell us in the notes". There's no free-text field for the hotel, and the API returns **422** for a transfer to an unpriced place (`api/bookings/route.js:168`). A guest must knowingly book the wrong hotel. |
| Dead or unused data | `zoneEst`, `ZONES[].est` and `getZone()` are unused. `searchPlaces()` duplicates the logic inside `PlacePicker`. |

**Known gaps** (from a spot check; the owner must confirm service and rates, Q-04):
- Hyatt Ziva / Hyatt Zilara Rose Hall
- Hilton Rose Hall
- Holiday Inn Montego Bay
- Named Negril resorts: Sandals Negril, Couples Negril / Swept Away, Royalton Negril / Hideaway, Riu Negril / Palace Tropical Bay, Azul Beach, Hedonism II, Beaches Negril
- Runaway Bay (e.g. Jewel Runaway Bay)
- Airbnbs and villas generally

### Two separate systems today
| | Transfers | Tours |
|---|---|---|
| Control | Native `<select>` (46 options, 6 optgroups) in `FareCalculator.jsx` and `TransferBooking.jsx` | `PlacePicker.jsx` bottom-sheet modal with substring search |
| State | Local component state | Global `PlaceProvider` (localStorage `ppp.place`) |
| Search | none | substring over `name + area + aka` |
| Selected feedback | "To {hotel}", **12px, ink/45** (measured) | Row highlight + ✓ inside the modal, then a field showing the name |
| Unlisted path | none | none |

A hotel chosen in one system doesn't carry over to the other (F-2A).

---

## 2. Requirements

**Must**
1. **One component** for every hotel choice: transfers, tours, and the tour list.
2. **Search by typing any part of the name**, in any word order, tolerating one typo and missing punctuation or accents.
3. **Useful without typing:** popular hotels and browse-by-area.
4. The **selected hotel is unmistakable** and can be changed with one tap.
5. **The price appears immediately after selection**, with a line confirming it was calculated for that hotel.
6. **A way forward when the hotel isn't listed** that doesn't require lying.
7. Mobile first: 44px+ targets, 16px text, keyboard-aware layout, no layout jumps.
8. Fully accessible (WAI-ARIA combobox + listbox).
9. Hotel data can grow to about 200 properties without code changes to the component.

**Won't (for now)**
- Maps
- Filters or sorting inside the search
- A live third-party hotel API (see §5)
- Geolocation ("hotels near me"): guests book before they arrive, so it's rarely useful

---

## 3. Search architecture

Client-side is correct: about 200 records is a few KB, and results are instant with no network, cost or failure mode.

### 3.1 Index (built once at module load, `app/data/hotel-search.js`)
For each place, precompute:
```
normalize(s) = s.toLowerCase()
                .normalize("NFD").replace(/\p{Diacritic}/gu, "")   // é → e
                .replace(/&/g, " and ")
                .replace(/[^a-z0-9 ]+/g, " ")                        // punctuation → space
                .replace(/\s+/g, " ").trim()
nameTokens   = tokens(normalize(name))
aliasTokens  = tokens of every alias (normalize)
areaTokens   = tokens(normalize(areaLabel + " " + areaAliases))       // "montego bay mobay mo bay rose hall"
```
Area aliases: MoBay, Mo Bay, Rose Hall, Ironshore, Ochi, Ocho, Runaway Bay, Lucea, Green Island, Whitehouse, Trelawny, Seven Mile Beach. (These must be stored as data, not in code.)

### 3.2 Matching
- The query is normalised and split into tokens. **Every query token must match** some indexed token (AND). Order doesn't matter, so "joia iberostar" matches.
- A query token matches an indexed token if either:
  - it's a **prefix** of it ("iber" → "iberostar"), which supports search-as-you-type; or
  - it's within **edit distance 1** (tokens of 4–7 characters) or **2** (8+ characters), using Damerau-Levenshtein, so "iberstar" and "hyat" still match.
- Stop-words are ignored in the query: "hotel", "resort", "the", "and", "spa", "jamaica".

### 3.3 Ranking
Score each match, then sort by score descending, then by `popularity` descending, then by name.
- +100: the name starts with the full query
- +40: a query token prefix-matches a **name** token
- +25: the query token matches an **alias**
- +10: the query token matches the **area**
- −15: a fuzzy (typo) match rather than an exact or prefix match

Show at most **8 results** while typing. With an empty query, show "Popular" (8), then "Browse by area".

### 3.4 Zero results
- Show: *No match for "{q}".* Then a list of the 3 closest names by fuzzy distance, if any are within reach ("Did you mean Hyatt…?"). Then the **[My hotel isn't listed]** button.
- Log the query (`hotel_no_results`, 06 §3). This is the weekly to-do list for adding hotels and aliases.

---

## 4. UX specification

### 4.1 States
```
IDLE (nothing chosen)
  Where are you staying? *
  ┌───────────────────────────────────────────┐
  │ 🔍  Search your hotel or resort           │   48px, ink/25 border, full width,
  └───────────────────────────────────────────┘   looks like a real input (not disabled)
  Choose your hotel to see your price.            small, ink/70

OPEN (mobile: full-screen sheet, fixed full height, never shrinks while typing)
  ← Back        Where are you staying?
  [ 🔍 hyat                              ✕ ]      autofocus is OK here: the user tapped a search field
  Hyatt Ziva Rose Hall                             16px semibold
    Rose Hall, Montego Bay                         14px ink/70
  Hyatt Zilara Rose Hall
    Rose Hall, Montego Bay
  ─────────────
  My hotel isn't listed  →                         always the last row, 48px

  Empty query:
  POPULAR            (8 rows)
  BROWSE BY AREA     Montego Bay (22) ›  Falmouth & Trelawny (7) ›  …   (tap → filtered list)

  Desktop: same content in an anchored dropdown under the field (max-height 60vh), not a centred modal.

SELECTED
  Where are you staying?
  ┌───────────────────────────────────────────┐
  │ ✓  Iberostar Joia Rose Hall     [Change]  │   crimson-600 2px border, crimson-50 bg,
  │    Rose Hall, Montego Bay                 │   name 16px bold ink, ✓ green-700,
  └───────────────────────────────────────────┘   "Change" 44px target
  → price panel appears directly below: "$80 total · both ways — for up to 4 people…"
    plus "Price for Iberostar Joia Rose Hall" (small), so it is visibly tied to the choice

REMEMBERED (from an earlier visit, via PlaceProvider)
  Same SELECTED card + a small line "From your last visit". No blocking confirmation;
  the pre-submit summary card repeats the hotel, which is the confirmation (replaces F-75's extra step).

UNLISTED
  Sheet step 2: "Which area is it in?"  (6 area rows, 48px)
  Step 3: "Hotel, villa or address"  [text input]  → [Use this]
  Selected card: ✓ "Villa Serenity (not listed)" · Negril   [Change]
  Price panel: per Q-03 → "About $X — confirmed within the hour" OR
               "We'll send your exact price within the hour" (CTA becomes "Send booking request")

ERROR (submit without a hotel)
  Field border crimson-700 + "⚠ Choose where you're staying." (14px), field scrolled into view and focused.
```

### 4.2 Mobile specifics
- The sheet uses `100dvh` so the iOS keyboard doesn't push the input off-screen, and its height doesn't change as results filter (F-72).
- Results scroll *under* a fixed search bar, and scrolling the results dismisses the keyboard (`blur` on `touchmove`).
- The input uses `type="search"`, `enterkeyhint="search"`, `autocomplete="off"`, `autocapitalize="words"`, and 16px text.
- Back (the Android back gesture) closes the sheet: push a history state on open.
- When there's exactly one result, **Enter** selects it.

### 4.3 Accessibility (WAI-ARIA combobox pattern)
- The input has `role="combobox"`, `aria-expanded`, `aria-controls="hotel-listbox"`, `aria-autocomplete="list"` and `aria-activedescendant`.
- The results have `role="listbox"` and the rows `role="option"` with `aria-selected`. Area headings are presentational group labels (`role="group"` + `aria-label`).
- ↑ and ↓ move through the options, Enter selects, Escape closes and returns focus to the trigger, and Home and End work.
- A live region announces "5 results" as the user types, and "{hotel} selected. Price $80." on selection.
- The sheet has `role="dialog"`, `aria-modal="true"` and `aria-labelledby`, with focus trapped inside.

---

## 5. Data sourcing options

| Option | What | Cost | Licensing | Reliability | Pricing fit | Verdict |
|---|---|---|---|---|---|---|
| **A. Curated list** (extend `places.js`) | Owner and dev add the ~100–200 properties PPP actually serves, with aliases and areas | Owner's time; no fees | None | Total control | **Direct**: each hotel has an owner-approved price | **Recommended now** |
| B. Google Places Autocomplete | Type-ahead of every place on the island | Metered per session; needs a billing account and key management. Check current pricing | ToS requires Google attribution; limits caching of results | High | **Poor**: returns coordinates, not prices; needs a zone-polygon layer to price, which reintroduces "zones" in code | Only if the zero-result rate stays high **after** A |
| C. OpenStreetMap (Nominatim / Overpass) | Free geodata | Free, but usage policy forbids heavy autocomplete on the public server | ODbL: attribution and share-alike on the derived database | Medium (coverage of small villas varies) | Same zone problem as B | Useful as a **one-time research source** to build list A, not at runtime |
| D. Hotel content APIs (booking platforms) | Rich hotel data | Partner agreements | Restrictive | High | Same zone problem | Not justified |

**Recommendation:** **A**, plus the "isn't listed" path, plus zero-result logging. Review in 8 weeks with real query logs. If more than ~5% of searches still end with "isn't listed", evaluate B with an area-polygon pricing layer. That's a separate, costed decision.

---

## 6. Data model (extended)

```js
// app/data/places.js  (or places.json once an admin UI exists)
{
  key: "hyatt-ziva-rose-hall",
  name: "Hyatt Ziva Rose Hall",
  area: "montego-bay",               // display + browse grouping
  locality: "Rose Hall",             // NEW: second line in results; "nearby" = same locality/area
  aliases: ["Hyatt Ziva", "Ziva"],   // renamed from `aka`
  zone: "mobay-hotels",              // tour pricing zone (unchanged)
  transfer: { oneWay: 10 },          // roundTrip derived as 2× unless explicitly set (Q-01)
  popularity: 8,                     // NEW: ordering for "Popular" and ties; seed manually, later from bookings
  active: true,                      // NEW: hide without deleting
  kind: "hotel" | "pier" | "area"    // NEW: "Negril beach hotels" is an area row, not a hotel
}
```
Area metadata moves to data: `AREAS[] = { key, label, aliases[], unlistedEstimate?: { oneWay } }`. `unlistedEstimate` only if Q-03 allows it.

**Optional: price bands** (owner decision). Today every hotel carries its own rate, and there are only 10 distinct one-way values across 46 hotels. Introducing `band: "mobay-b"` with a band→rate table would make adding a hotel a one-field decision and price changes a one-line edit. **Recommended if the list grows past ~80.** The behaviour doesn't change.

---

## 7. Pricing logic (user-facing)

The user selects a hotel. The system then handles hotel → rate (or band) → `rate × max(4, people)` → total, and shows only the total and who it covers.

- The same `pricing.js` stays the single source of truth, shared by the client and the server (keep this).
- Unlisted hotels: `transfer` is null, so the booking is saved as `status: "new"` with `customPlace` and no online payment. The API must **accept** this instead of returning 422. It becomes a request, not a confirmed booking.

---

## 8. Implementation

| Step | Files |
|---|---|
| Search utilities + tests | `app/data/hotel-search.js`, `app/data/hotel-search.test.js` (node --test, matching the existing test setup): the §3 algorithm, pure functions |
| Data schema + migration | `app/data/places.js`: rename `aka`→`aliases`, add `locality`/`popularity`/`kind`/`active`; remove dead `zoneEst`/`getZone` |
| Component | `app/components/HotelSearch.jsx` (field + sheet/dropdown + states), reading and writing `PlaceProvider` |
| Replace usages | `TransferBooking.jsx` (select), `FareCalculator.jsx` (deleted, 08), `BookingForm.jsx` (tour hotel field), `PlacePicker.jsx` (becomes the sheet inside HotelSearch, or is deleted), `PlaceChip.jsx`/`PlacePrompt.jsx` (removed from header; the tour list keeps a compact "Prices for: {hotel} · Change") |
| API | `app/api/bookings/route.js`: accept `customPlace` for unlisted hotels, validate length and area, set `status: "new"`, skip payment |
| Owner data collection | A spreadsheet: hotel name · aliases · area · locality · one-way rate · served? Imported into `places.js` |

### Acceptance tests (search)
| Query | Expected top result |
|---|---|
| `hyatt` | Hyatt Ziva Rose Hall, Hyatt Zilara Rose Hall (after data added) |
| `joia iberostar` | Iberostar Joia Rose Hall |
| `iberstar` (typo) | the 3 Iberostar properties |
| `FDR` | Franklyn D. Resort & Spa |
| `sandals mobay` | Sandals Montego Bay, Sandals Royal Caribbean |
| `riu` | 5 Riu properties, Montego Bay first by popularity |
| `franklyn d resort` | Franklyn D. Resort & Spa (the "&" is normalised) |
| `ocho` | Ocho Rios & St. Ann properties |
| `xyzhotel` | zero results, then "My hotel isn't listed" |
| *(empty)* | Popular 8 + Browse by area |

### UX acceptance (manual, 375px phone)
- A first-time tester finds and selects their hotel in under 15 seconds without help.
- After selection, the tester can say which hotel is selected and what the price covers, without scrolling.
- Keyboard-only: select a hotel using Tab, typing, ↓ and Enter; Escape returns focus.
- VoiceOver / TalkBack announce the result count and the selection.
