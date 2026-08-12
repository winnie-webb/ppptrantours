# Image credits

Every image in this repo **except `public/team/` and `public/ppp/`** is a
placeholder for local development. Replace them with licensed or original
PPP Tran Tours photography before launch.

## `public/ppp/` — PPP's own photography (recovered)

**These are the company's own images and are cleared to use.** Recovered
2026-08-12 from the previous WordPress site's media library, which survived
intact on the old A2 Hosting account at
`ppptrantoursjamaica.com/wp-content/uploads/` even though the site itself was
serving zero-byte 200s. Names were enumerated via the Wayback CDX API, then the
files fetched from the live server, so these are the original uploads rather
than Wayback's re-encodes.

| file | native size | subject |
| --- | --- | --- |
| `donovan-airport-van.jpg` | 1001×550 | Mr. Pugh in uniform at Sangster departures beside a PPP van, door decal visible |
| `banner-ricks-cafe.jpg` | 1200×400 | Rick's Cafe cliffs, Negril |
| `banner-ys-falls.jpg` | 1200×400 | YS Falls |
| `banner-jerk-pit.jpg` | 1200×400 | Jerk pit, pork on the grill |
| `banner-craft-market.jpg` | 1200×400 | Craft market vendor with wood carvings |
| `banner-fisherman-mobay.jpg` | 1200×400 | Fisherman with snapper catch, Montego Bay |
| `banner-waterfall-guests.jpg` | 1200×400 | Guests in PPP-branded shirts at a waterfall |
| `banner-sunset.jpg` | 1200×400 | Sunset over open sea (no people) |
| `river-tubing.jpg` | 700×550 | River tubing under a stone bridge — no matching product yet |
| `ricks-cafe.jpg` | 674×446 | Rick's Cafe — wired to `ctp-15` |
| `mystic-mountain.jpg` | 600×400 | Mystic Mountain — wired to `abc-10` |
| `awards/tripadvisor-2017.png` | 159×138 | Tripadvisor award badge — genuine credential |
| `awards/tripadvisor-2018.jpg` | 150×126 | Tripadvisor award badge — genuine credential |
| `*-small.jpg` | ~220–300px | `donovan-van`, `donovan`, `blue-hole`, `black-river-croc`, `mayfield-falls`, `nine-mile` — original uploads were already this small. Reference/shot-list quality only; **do not** wire into card or banner slots, they will upscale badly. |

⚠️ Several of these show **identifiable guests** (`banner-ys-falls`,
`banner-waterfall-guests`, `donovan-airport-van`). They ran on PPP's own site for
years, so consent was presumably obtained at the time — worth confirming with
Mr. Pugh, as with `public/team/`.

Deliberately **not** recovered, though present in the same media library: photos
and logos belonging to third parties — `CHUKKA-River-Tubing-Safari-4.jpg`
(Chukka Caribbean's marketing photo, and the largest file in the library at
960×638), plus Appleton Estate, Dunn's River, Rick's Cafe, Doctor's Cave,
Dolphin Cove and Bob Marley logo GIFs. Reusing those would recreate exactly the
problem `public/fleet/` had. Old theme chrome (the `p_tran` / `p_tours` /
`private` / `personalized` / `professional` text graphics, nav sprites and the
superseded `PPP-logo-v3.png`) was also skipped — the current site draws its
branding in markup and already has the real logo.

## `public/team/` — Donovan Pugh

Supplied by the client: Mr. Pugh with guests outside a resort in Montego Bay.
Cropped two ways from one original — `donovan-pugh.jpg` (square, About page) and
`donovan-portrait.jpg` (3:4, homepage collage).

⚠️ The photo shows **identifiable guests** alongside Mr. Pugh. Confirm they have
consented to appearing on the public site, or re-crop to Mr. Pugh alone, before
this goes live.

## `public/local/hero-*.jpg` — scenery

Wikimedia Commons. Cropped and re-encoded; otherwise unmodified.

| File | Source | Licence |
| --- | --- | --- |
| hero-1.jpg | *Iberostar Rose Hall Beach, Montego Bay, Jamaica 2011* | CC BY 2.0 |
| hero-2.jpg | *Rick's Cafe, Negril, Jamaica (Unsplash)* | CC0 |
| hero-3.jpg | *Jamaica Ocho Rios Dunn's River Falls (beach)* | CC BY-SA 4.0 |
| hero-4.jpg | *Divers at Ricks Cafe in Negril — panoramio* | CC BY 3.0 |
| hero-5.jpg | *Jamaica Ocho Rios Dunn's River Falls 1* | CC BY-SA 4.0 |
| hero-6.jpg | *Blackriver.JPG* | CC BY-SA 4.0 |
| hero-7.jpg | *Y.S. Falls.jpg* | CC BY-SA 3.0 |
| hero-8.jpg | *Tramonto al Rick's Cafe — panoramio* | CC BY 3.0 |

CC BY and CC BY-SA require visible attribution wherever the image is published.
Either credit these on the page, or replace them with owned photography — the
latter is the intent.

## `public/at/at-*.webp` — airport transfers

Re-cut from the same Wikimedia scenery above, one per destination region. These
replaced the original files, which were Eternal Tours marketing posters (text
graphics, not photographs).

## `public/ctp/`, `public/abc/` — partial replacements

`ctp-1`, `ctp-3`, `ctp-5`, `ctp-8`, `ctp-16`, `ctp-22` and `abc-11` were
replaced because the originals had marketing text burned into the image or were
letterboxed. Sources:

| File | Source | Licence |
| --- | --- | --- |
| ctp-1, ctp-3 | *Floyd's Pelican Bar* | CC0 |
| ctp-5 | *Appleton Estate Jamaica Rum 02* | CC BY-SA 4.0 |
| ctp-8 | *Y.S. Falls.jpg* | CC BY-SA 3.0 |
| ctp-16, abc-11 | *Divers at Ricks Cafe in Negril — panoramio* | CC BY 3.0 |
| ctp-22 | *Jamaica, Rio Grande1.JPG* | CC BY-SA 3.0 |

## `public/fleet/` — removed

Previously held three vehicle photos taken from bestjamaicatours.com. They were
another operator's vehicles, and `van.webp` showed a legible Jamaican plate
(P35005), making a specific third-party vehicle identifiable. **Deleted** — note
that files under `public/` are served whether or not any component imports them,
so leaving them in place would have kept publishing them.

`FleetSection.jsx` now leads with `public/ppp/donovan-airport-van.jpg` (genuine,
see below) and renders the three vehicle classes as spec-only tiles. Add
per-vehicle `image` keys back once Mr. Pugh supplies photos of his own sedan,
minivan and touring van.

## Remaining `public/{mpt,abc,ctp,cse,egt,st}/*.webp`

Copied from the sibling `eternaltours-master` repo. Provenance unknown; treat as
unlicensed and replace.
