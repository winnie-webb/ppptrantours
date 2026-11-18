# Drive times

Regenerates `app/data/drive-times.generated.js`: road-routed minutes from every
pickup point in `places.js` to Sangster International (MBJ) and to every tour.

Run from `pptrantours/`, with a scratch folder `$W` outside the repo:

1. `node scripts/drive-times/export.mjs $W` — writes `places.json` and
   `tours.json`.
2. `node scripts/drive-times/geocode.mjs $W` — geocodes on OpenStreetMap
   (Nominatim, 1 request/second). `geo.json` here is the last result; copy it
   into `$W` to skip this step.
3. `node scripts/drive-times/route.mjs $W` — routes with the public OSRM server.
   Hand corrections for bad geocodes live in `FIX_P` / `FIX_A` at its top;
   **add one for any new hotel the geocoder misses.**
4. `node scripts/drive-times/gen.mjs $W app/data/drive-times.generated.js`

Check a few results against Google Maps before shipping.
