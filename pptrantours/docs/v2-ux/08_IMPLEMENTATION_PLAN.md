# 08 — Implementation Plan

Build order is **foundation → hotel search → transfer flow → checkout → homepage/IA → tours → cleanup**. Each phase ships on its own, behind no flags, and ends with a verification gate. Nothing in a later phase is started until the previous gate passes.

**Before writing any code:** `AGENTS.md` warns that this Next.js (16.x) differs from older versions. Read the relevant guide in `node_modules/next/dist/docs/` for any App Router, routing or caching API you touch.

**i18n:** English first. New or changed-meaning strings get **new keys** in `en.json`, with English fallbacks in code. The other 9 locales fall back until they are translated. Remove keys only in Phase 7.

---

## Phase 0: Decisions and measurement (no UI change)
| Task | Owner | Output |
|---|---|---|
| Answer Q-01…Q-12 (`01_UX_AUDIT.md` §6) | Business owner | Written answers in this folder (`09_DECISIONS.md`) |
| Hotel data sheet: every property served, aliases, area, locality, one-way rate | Owner + dev | CSV, then `places.js` in Phase 2 |
| Approve cancellation and booking terms (`app/data/policies.js` drafts) | Owner | Terms marked approved |
| Choose a cookieless analytics tool; add events from 06 §3 | Dev | Events firing in production |
| Collect a baseline | — | ≥ 2 weeks of funnel data before Phase 3 ships, if the timeline allows |

**Gate 0:** Q-01, Q-02, Q-03, Q-04 and Q-05 are answered, because they change flows. The rest can land during later phases.

---

## Phase 1: Design foundations (low risk, site-wide)
**Scope:** 04_DESIGN_SYSTEM §1–5, §7.

| Change | Files |
|---|---|
| Type scale tokens (`fontSize` in theme), colour tokens (`text-muted` etc.), `green-700` success | `tailwind.config.js` |
| `h1,h2` = Fraunces only; `h3` = sans bold; `.label` sentence case 15px; `.field` 48px, border ink/25, `focus-visible`; global focus-visible outline; `.btn` min-height 48px; `.btn-secondary`, `.btn-link` | `app/globals.css` |
| Skip link + `<main id="main">` | `app/[locale]/layout.js` |
| Replace `text-ink/40…/55` and arbitrary `text-[0.6x rem]` with tokens (≈85 + 38 sites) | pattern across `app/components/*`, `app/[locale]/**`. Representative: `TourCard.jsx`, `TourPrice.jsx`, `BookingForm.jsx`, `PlacePicker.jsx`, `CategoryChips.jsx`, `Footer.jsx` |
| Form section headings → `h3` token (**F-40**) | `BookingForm.jsx` (section heading helper around line 1018) |
| Steppers 44px; date/time stacked below `sm` | `BookingForm.jsx` (~1409/1420, ~655) |
| Mobile menu: dialog semantics, Escape, focus trap, `aria-expanded`; FAQ `<details>` | `Header.jsx`, `FaqAccordion.jsx` |
| WhatsApp FAB contrast and label | `WhatsAppFab.jsx` |

**Verify:** `npm run lint && npm test && npm run build`. At 375px, walk Home, /transfers, /tour/blue-hole and /contact-us. Lighthouse Accessibility ≥ 95 on each. An axe scan shows no contrast or label violations. Keyboard-only pass through the header, menu and booking form.

---

## Phase 2: Hotel search (the reported failure)
**Scope:** `07_HOTEL_SELECTION.md` in full.

| Change | Files |
|---|---|
| Normalise, tokenise, fuzzy match, rank; pure functions | **new** `app/data/hotel-search.js` |
| Unit tests for the §8 acceptance table | **new** `app/data/hotel-search.test.js`; extend the `test` script glob in `package.json` to include `app/**/*.test.js` |
| Schema: `aliases`, `locality`, `popularity`, `kind`, `active`; area aliases; import the owner's CSV; delete `zoneEst`, `getZone`, the old `searchPlaces` | `app/data/places.js` |
| Combobox + sheet (mobile) / dropdown (desktop), all states in 07 §4 | **new** `app/components/HotelSearch.jsx` |
| Global state: `PlaceProvider` stays the store; HotelSearch reads and writes it; "From your last visit" replaces the blocking confirm | `PlaceProvider.jsx`, `BookingForm.jsx` (remembered-hotel block ~592–621) |
| Tour booking uses HotelSearch | `BookingForm.jsx` (tour hotel field) |
| Remove `PlacePicker`, `PlaceChip` (header), `PlacePrompt` (replaced by a compact "Prices for {hotel} · Change" on the tour list) | `PlacePicker.jsx`, `PlaceChip.jsx`, `PlacePrompt.jsx`, `Header.jsx`, `tours/page.jsx`, `category/[type]/page.jsx`, `destinations/page.jsx` |

**Verify:** `npm test` (search table passes). At 375px on a tour page: search "hyatt" (once data is added), "joia iberostar", "iberstar", "FDR". Select, and the selected card and price appear without scrolling. Change the hotel. Try "isn't listed". Keyboard and screen reader (NVDA or VoiceOver) announce the count and the selection. The remembered hotel shows on the next page view.

---

## Phase 3: Transfer flow
**Scope:** `02_USER_FLOWS.md` §1.

| Change | Files |
|---|---|
| **Server first:** `direction: "to-hotel" \| "to-airport" \| "both"` replaces `tripType`. `priceTransfer` accepts it (one-way rate for either single direction, pending Q-01). **The current API treats any value other than `"one-way"` as a round trip. Update and validate server-side before the UI sends a new value**, or departure-only bookings will be charged double. Keep accepting the legacy `tripType` during rollout | `app/products/pricing.js`, `app/api/bookings/route.js`, `lib/booking-shared.js` (WhatsApp text), `lib/email/templates/booking-alert.js` (+ test) |
| Accept unlisted hotels: `customPlace {area, text}`, `status:"new"`, not collectible | `app/api/bookings/route.js`, `lib/bookings.js` |
| Two-stage transfer tool: Stage 1 (HotelSearch, Which way?, people, price panel, `Continue · $X`); Stage 2 (direction-specific flight fields, details, pay, summary, `Book transfer · $X`) | `TransferBooking.jsx`; split the transfer branch out of `BookingForm.jsx` into `app/components/booking/` (e.g. `PricePanel.jsx`, `BookingSummary.jsx`, `useBookingDraft.js`) so both products share the parts without one 1,400-line file |
| Price sentence helper (one place) | `pricing.js` → `describeTotal(quote, direction)` |
| `/transfer/[place]` pre-fills the same tool (hotel changeable) | `app/[locale]/transfer/[place]/page.jsx` |
| Rate list → collapsed "All transfer prices" `<details>` below the tool | `app/[locale]/transfers/page.jsx` |
| Delete the homepage calculator | `FareCalculator.jsx` (deleted in Phase 5 with the homepage rewrite; stop linking to it now) |
| Admin console shows `direction` and `customPlace` | `app/admin/AdminClient.jsx`, `app/api/admin/bookings/*` |

**Verify:** `npm test` (add pricing tests for all three directions × 1/4/5 people, and an API test that `to-airport` is never priced as both). Run the mock payments locally (`PAYMENTS_MOCK=1`). At 375px, book each direction plus the unlisted path end to end. Firestore docs contain the correct fields. The admin shows them. The owner alert email reads correctly.

---

## Phase 4: Checkout and confirmation (both products)
| Change | Files |
|---|---|
| Summary card + terms link above submit; specific CTA with price; hide empty "How you'll pay" | `BookingForm.jsx` / `booking/*` |
| Draft persistence in `sessionStorage` (cleared on success) | `booking/useBookingDraft.js` |
| After a successful save, go to `/booking/[ref]?p=token` for **every** booking; the page shows the full summary (product, hotel, direction, dates, people, total, payment state) | `api/bookings/route.js` (return the lookup token for all), `app/[locale]/booking/[reference]/page.jsx` |
| **Guest confirmation email** (reference, summary, next steps, link to the booking page, WhatsApp) | **new** `lib/email/templates/booking-confirmation.js` (+ test), `lib/notify.js`. Check the EmailJS free-plan limit (200/month) vs volume; the planned Resend move may need to come first |
| Error and availability copy aligned (Q-08) | `en.json` |

**Verify:** book with cash and with the card mock. Reload the confirmation, and it persists. The email is received and its link opens the same page. Kill the network mid-submit, and the WhatsApp fallback still works. Draft survives a reload.

---

## Phase 5: Homepage, navigation, IA
**Scope:** `03_INFORMATION_ARCHITECTURE.md`.

| Change | Files |
|---|---|
| New hero: H1 + sub + two task cards (transfer card embeds HotelSearch → "See price" goes to /transfers with the hotel carried via PlaceProvider) | `Hero.jsx`, `app/[locale]/page.js` |
| Homepage sections cut to 7; promise, stats, gallery, fleet move to About | `page.js`, `about-us/page.jsx` |
| Header: "Book a transfer" → /transfers; nav = Airport transfers · Tours · About · Contact; remove header search | `Header.jsx`, `SearchBar.jsx` (delete if unused) |
| Remove the transfers tile from categories; `/destinations` → 308 to `/tours` | `CategoryChips.jsx`, `app/data/site.js`, `proxy.js` or `next.config.mjs` redirects, `app/sitemap.js` |
| Delete `FareCalculator.jsx`, `SloganBand` usage, `CtaBand` duplication | components |

**Verify:** 375px: Home is ≤ ~6 screens (measure `scrollHeight` ≤ ~5,000px). The transfer card is visible in the first screen. Every nav link works. `/destinations` redirects. Sitemap updated. Build is clean.

---

## Phase 6: Tours
| Change | Files |
|---|---|
| Region chips only, all tours on one page, no sort or pagination | `TourGrid.jsx`, `tours/page.jsx`, `category/[type]/page.jsx` |
| Card: image, title, duration, price-sm (Q-05 framing), "View tour" | `TourCard.jsx`, `TourPrice.jsx` |
| Detail: included / not-included block; rating labelled as the company's and moved to the reviews block; pickup-time rule (Q-10) | `tour/[id]/page.jsx`, `BookingForm.jsx` / `booking/*` |
| Combos as a chip; "Build my day" stays a secondary link there | `ComboPitch.jsx` |

**Verify:** at 375px, browse → filter → open → book a tour end to end. The card price matches the booking price for 2 people (the same framing). Lighthouse A11y ≥ 95.

---

## Phase 7: Copy and cleanup
- Apply `05_COPY_GUIDELINES.md` §4–5 across `en.json`. Delete dead keys (`autoNote`, `noteTotal`, `ratesDescription`, `transferPage.intro`, `place.footnote`, …) and dead code (the `TRANSFERS` catalogue products in `catalogue.js:807-877`, the `/transfers#transfer-*` card links, the unused `price.estimated`).
- Fix stale comments noted in the audit (e.g. `transfer/[place]/page.jsx:219`, `tour/[id]/page.jsx:287-296`).
- Update the privacy policy about children's ages (F-52), and the terms about "indicative" rates.
- README: remove the "Payments: no processor is wired" placeholder note (now false).

**Verify:** grep for removed keys shows no references. `npm run lint && npm test && npm run build`.

---

## Final gate (release)
1. **5 moderated phone tests** with first-time users (06 §3). Each must book a transfer for a named hotel in under 2 minutes without help, and say what the price covers.
2. Re-answer the **UX gate** table (`01_UX_AUDIT.md` §7). Every row must be "Yes".
3. Analytics: hotel search success > 90% and zero-result queries reviewed. Compare the funnel against the Phase 0 baseline after 2–4 weeks.

## Risks and mitigations
| Risk | Mitigation |
|---|---|
| Departure-only priced as round trip during rollout | Server-first change + legacy field compatibility + API test (Phase 3) |
| SEO loss on `/transfer/[place]` and `/destinations` | Keep transfer URLs unchanged; 308 redirect for destinations; update the sitemap |
| Stale translations contradict new English | New keys for changed meaning; code fallbacks |
| Email volume exceeds the EmailJS free tier once guests get emails | Do the Resend migration before or with Phase 4 |
| Hotel data takes the owner time | Ship the search component with current data first; data grows weekly from zero-result logs |
| Removing brand content upsets the owner | It moves to About, not deleted; show the before/after at 375px during review |
