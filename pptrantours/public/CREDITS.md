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
| `guest-ppp-branded.jpg` | 1200×382 | Guest in PPP cap and shirt holding a PPP Tran Tours plate. **Left half is a flat gradient** the old theme reserved for overlaid text; the subject is in the right quarter, so this only works anchored right (`object-right`) in a portrait box. Used in the homepage `PromiseSection` collage. |
| `river-tubing.jpg` | 700×550 | Guests river tubing — homepage `PromiseSection` collage |
| `ricks-cafe.jpg` | 674×446 | Rick's Cafe — wired to `ctp-15` |
| `mystic-mountain.jpg` | 600×400 | Mystic Mountain — wired to `abc-10` |
| `awards/tripadvisor-2017.png` | 159×138 | Tripadvisor badge — genuine credential, shown on About at native size |
| `awards/tripadvisor-2018.jpg` | 150×126 | Tripadvisor badge — genuine credential, shown on About at native size |
| `*-small.jpg` | ~220–300px | `donovan-van`, `donovan`, `blue-hole`, `black-river-croc`, `mayfield-falls`, `nine-mile` — original uploads were already this small. Reference/shot-list quality only; **do not** wire into card or banner slots, they will upscale badly. |

⚠️ Several of these show **identifiable guests** (`banner-ys-falls`,
`banner-waterfall-guests`, `donovan-airport-van`). They ran on PPP's own site for
years, so consent was presumably obtained at the time — worth confirming with
Mr. Pugh, as with `public/team/`.

### Supplied 2026-10-22 (PPP's own Instagram photography)

Ten photos of guests in PPP tees and caps, the vans, and Mr. Pugh, supplied
directly by the client. Mostly 1080×1080; `waterfall-ppp-sign.jpg` was cropped
out of a letterboxed 1080×1920 story. Each is used in exactly one place:
`horseback-ppp-tee` and `donovan-rafting-guests` in the `PromiseSection`
collage, the other eight in the homepage `PhotoReel`.

`horseback-trio-ppp`, `horseback-ppp-tee`, `tee-horseback-closeup`,
`tee-portrait-beach`, `ppp-cap-horse`, `waterfall-ppp-sign`,
`donovan-rafting-guests`, `guests-van-beach`, `guests-van-resort`,
`guests-ricks-cafe`.

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

## `public/tours/` — tour and combo photos

Replaced the 300×300 thumbnails on 2026-10-22. Each product has its own photo
(`<product id>.jpg`, 1600px on the long side); none is reused elsewhere.

Credits are **not shown on the page** (the client's decision). Licensed photos
carry an `imageCredit` in `app/data/catalogue.js`, which the tour page emits in
its schema.org `ImageObject` only. ⚠️ CC BY / BY-SA ask for attribution
"reasonable to the medium" — a hidden credit may not satisfy that. If that
matters, either show the credit or swap the rows marked *credit required* for
Unsplash/Pexels photos.

| File | Source | Author | Licence | Credit required |
| --- | --- | --- | --- | --- |
| blue-hole.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Blue_Hole_~_Ocho_Rios.jpg) | Thank You (23 Millions+) views | CC BY 2.0 | **yes** |
| dunns-river-falls.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Climbing_Dunn%27s_River_Falls.jpg) | Thank You (23 Millions+) views | CC BY 2.0 | **yes** |
| mystic-mountain.jpg | [Unsplash](https://unsplash.com/photos/uxh_FRlmORg) | Kenrick Baksh | Unsplash License | no |
| dolphin-cove-ocho-rios.jpg | [Pexels](https://www.pexels.com/photo/28770247/) | Emilio Sánchez Hernández | Pexels License | no |
| bob-marley-nine-mile.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bob_Marley%27s_Mausoleum.JPG) | Enrospr | Public domain | no |
| dolphin-cove-montego-bay.jpg | [Pexels](https://www.pexels.com/photo/39972152/) | TonyNojmanSK | Pexels License | no |
| rose-hall-great-house.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rose_Hall_Jamaica_Photo_Don_Ramey_Logan.jpg) | Don Ramey Logan | CC BY-SA 3.0 | **yes** |
| montego-bay-highlights.jpg | [Unsplash](https://unsplash.com/photos/7LbIUXkMA8I) | Brighton Pereira | Unsplash License | no |
| sand-and-saddle.jpg | [Pexels](https://www.pexels.com/photo/5503462/) | Leonardo Rossatti | Pexels License | no |
| river-rapids-tubing.jpg | [Pexels](https://www.pexels.com/photo/33986446/) | Man Fong Wong | Pexels License | no |
| martha-brae-rafting.jpg | [Pexels](https://www.pexels.com/photo/38921246/) | Chris G Brown | Pexels License | no |
| luminous-lagoon.jpg | [Pexels](https://www.pexels.com/photo/26794599/) | Chasing Lyu | Pexels License | no |
| negril-seven-mile-beach.jpg | [Unsplash](https://unsplash.com/photos/CDTL4Wtyi8w) | Tom Podmore | Unsplash License | no |
| ricks-cafe.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rick%27s_Cafe,_Negril,_Jamaica_(Unsplash).jpg) | Simson Petrol simson_petrol | CC0 | no |
| ys-falls.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Y.S._Falls.jpg) | Ufos8mycow00 | CC BY-SA 3.0 | **yes** |
| black-river-safari.jpg | [Unsplash](https://unsplash.com/photos/jIk3I_e16uw) | Yves Alarie | Unsplash License | no |
| appleton-estate.jpg | [Pexels](https://www.pexels.com/photo/5720872/) | Piotr Grzankowski | Pexels License | no |
| combo-blue-hole-dunns-river.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Blue_Hole,_Ocho_Rios_2019.jpg) | Thank You (23 Millions+) views | CC BY 2.0 | **yes** |
| combo-ys-falls-black-river.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Black_River_%E2%80%93_Boot_mit_Safari-G%C3%A4sten_auf_dem_Black_River_(1998).jpg) | ingostrutz | CC BY-SA 3.0 | **yes** |
| combo-appleton-ys-falls.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Appleton_Estate_Jamaica_November_2012.jpg) | Acampbell3000 | CC BY 3.0 | **yes** |
| combo-negril-beach-ricks-cafe.jpg | [Pexels](https://www.pexels.com/photo/19565413/) | Ranteen Dixon | Pexels License | no |
| combo-sand-saddle-river-rapids.jpg | [Unsplash](https://unsplash.com/photos/-Vd3bSiHTys) | Kyle Mackie | Unsplash License | no |
| combo-martha-brae-doctors-cave.jpg | [Unsplash](https://unsplash.com/photos/OL4j0kejZPk) | Jeffrey Valenzuela | Unsplash License | no |
| combo-dunns-river-mystic-mountain.jpg | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Dunn%27s_River_Falls.jpg) | Thank You (23 Millions+) views | CC BY 2.0 | **yes** |

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
