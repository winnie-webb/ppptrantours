# PPP Tran Tours Jamaica

Marketing and booking site for **PPP Transfers & Tours Jamaica** — private airport
transfers, island tours and cruise-pier excursions, run out of Montego Bay by
owner Donovan Pugh.

Rebuilt from scratch: the original WordPress site is gone, so the company
details, copy and FAQs here were recovered from the Wayback snapshot of
`ppptrantoursjamaica.com` (2026-01-22) and the Tripadvisor listing. Pricing and
the tour catalogue come from the sibling `eternaltours-master` repo.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 3 · Firebase

**Brand:** crimson `#a80424` and gold `#f1d72d`, sampled from the company logo,
exposed as the `crimson` and `gold` Tailwind scales in `tailwind.config.js`.
`ink` is a warm near-black tinted toward the crimson rather than neutral grey.

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm start   # production build
```

---

## Firebase

Firebase is wired but **not required to run**. `lib/firebase.js` only
initializes once real keys are present, so the whole site builds and every form
works without a project attached.

1. `cp .env.local.example .env.local`
2. Paste the web-app config from Firebase console → Project settings → General.
3. Restart the dev server.

**Before the keys land:** `createBooking()` returns a booking reference and a
pre-filled WhatsApp deep link, and the UI tells the guest to send it through.
**After the keys land:** the same call writes to the `bookings` Firestore
collection with `status: "new"` and a server timestamp. No other code changes.

`lib/firebase.js` also exports lazy `getFirebaseAuth()` and
`getFirebaseStorage()` accessors, ready for an admin dashboard and a gallery
uploader.

---

## Layout

```
app/
  data/
    products.json        103 tours — generated, see "Catalogue" below
    site.js              company facts, reviews, FAQs, destinations
  products/product.js    catalogue accessors (filter, search, sort, format)
  components/            Header, Hero, TourCard, TourGrid, TourRail, …
  category/[type]/       one page per category (9, statically generated)
  product/[id]/          tour detail + BookingForm (103, statically generated)
  tours/ destinations/ about-us/ contact-us/
lib/
  firebase.js            lazy init, `isFirebaseConfigured`
  bookings.js            createBooking() + WhatsApp fallback
public/{at,mpt,abc,ctp,cse,egt,st,local}/   tour and scenery images
```

## Catalogue

`app/data/products.json` was derived from the Eternal Tours catalogue with three
fixes applied:

- **Unique ids.** The source reused `cse-1`…`cse-11` across the `cse`, `edt` and
  `ncb` categories, which collided in `generateStaticParams`. Ids are now
  `{category}-{n}` and unique.
- **Explicit `image`.** The source derived the image path from the id prefix,
  which breaks once ids change. Each product now carries its own `image` path.
- **Normalized `pickups`.** Loose `priceFalmouth` / `"Riu Negril Price"` keys are
  now a sorted `[{key, label, price}]` array, which is what the booking form and
  the price table read.

Each product also gained a written `desc`, a `duration` and a `highlights` list.

Prices are per person in USD and match Eternal Tours. Children are billed at
50% in `BookingForm.jsx` (`CHILD_RATE`).

---

## Known placeholders

These are deliberate and need replacing before launch:

- **Images.** All placeholders except `public/team/` — see `public/CREDITS.md`
  for per-file sources and licences. Two sets were replaced outright rather than
  reused from Eternal Tours:
  - `public/local/hero-*.jpg` were identifiable photos of *another operator's*
    guests. Now Wikimedia Commons scenery.
  - `public/at/at-*.webp` were Eternal Tours marketing posters — text graphics,
    not photographs. Now destination scenery, one per transfer region.

  Several `ctp-*` / `abc-*` images with burned-in text were also swapped. The
  rest still come from the Eternal Tours repo. Note the CC BY / CC BY-SA files
  require visible attribution if they ship as-is.
- **Fleet photos.** `public/fleet/` is taken from bestjamaicatours.com and shows
  **another operator's vehicles**. Replace before launch.
- **Owner photo.** `public/team/` is the client's own photo and is real — but it
  shows identifiable guests. Confirm their consent, or re-crop to Mr. Pugh
  alone, before launch.
- **Logo.** `components/Logo.jsx` and `app/icon.svg` redraw the three-P mark in
  markup, in the brand crimson and gold. Swap in the real artwork when a clean
  vector is available.
- **Social links.** Facebook and Instagram in `app/data/site.js` point at the
  bare domains — no PPP accounts were found. The Tripadvisor link is real.
- **Payments.** No processor is wired. The booking form takes a request and
  confirms availability first; it never charges.
- **Stats.** "1,000+ guests" and "30+ countries" in `app/data/site.js` are
  plausible but unverified; the 5.0 / 680-review figure is real (Tripadvisor).
